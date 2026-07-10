import time
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import io
import os
import shutil

from backend.database import DatabaseManager
from backend.gemini_service import GeminiService

app = FastAPI(title="QueryChat AI API", version="1.0.0")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize global managers
db_manager = DatabaseManager()
gemini_service = GeminiService(db_manager)

# In-memory history for analytics
query_history = []

class ConnectionRequest(BaseModel):
    db_type: str  # "mysql" or "sqlite"
    host: Optional[str] = "localhost"
    port: Optional[int] = 3306
    username: Optional[str] = "root"
    password: Optional[str] = ""
    database: Optional[str] = ""
    sqlite_path: Optional[str] = "querychat_demo.db"

class ChatRequest(BaseModel):
    message: str
    api_key: Optional[str] = None

@app.post("/api/connect")
async def connect_db(req: ConnectionRequest):
    if req.db_type == "mysql":
        res = db_manager.connect_mysql(
            host=req.host,
            port=req.port,
            username=req.username,
            password=req.password,
            database=req.database
        )
    else:
        res = db_manager.connect_sqlite(filepath=req.sqlite_path)
        
    if res["status"] == "error":
        raise HTTPException(status_code=400, detail=res["message"])
    return res

@app.get("/api/connection-status")
async def get_connection_status():
    return {
        "db_type": db_manager.db_type,
        "mysql_config": {
            "host": db_manager.mysql_config["host"],
            "port": db_manager.mysql_config["port"],
            "username": db_manager.mysql_config["username"],
            "database": db_manager.mysql_config["database"]
        },
        "sqlite_path": db_manager.sqlite_path
    }

@app.get("/api/tables")
async def get_tables():
    return {
        "tables": db_manager.get_tables_list(),
        "schema": db_manager.get_schema_info()
    }

@app.post("/api/chat")
async def chat_with_db(req: ChatRequest, x_gemini_api_key: Optional[str] = Header(None)):
    api_key = req.api_key or x_gemini_api_key
    
    start_time = time.time()
    
    # 1. Translate question to SQL
    sql_res = gemini_service.generate_sql(req.message, api_key)
    sql_query = sql_res["sql"]
    is_mocked = sql_res["is_mocked"]
    error_detail = sql_res.get("error", None)

    # 2. Execute SQL query on connected database
    exec_res = db_manager.execute_query(sql_query)
    execution_duration = (time.time() - start_time) * 1000  # in ms
    
    # Track query in history for analytics
    target_table = "unknown"
    # Heuristic to find table name in query
    for t in db_manager.get_tables_list():
        if t["name"].lower() in sql_query.lower():
            target_table = t["name"]
            break

    query_record = {
        "timestamp": datetime.now().isoformat(),
        "question": req.message,
        "sql": sql_query,
        "table": target_table,
        "duration_ms": execution_duration,
        "status": "success" if exec_res["status"] == "success" else "error"
    }
    query_history.append(query_record)
    
    if exec_res["status"] == "error":
        return {
            "success": False,
            "sql": sql_query,
            "error_message": exec_res["message"],
            "is_mocked": is_mocked,
            "api_error": error_detail,
            "duration_ms": execution_duration,
            "explanation": "The generated SQL query failed to execute. Please try rephrasing your question or check the database connections."
        }

    # 3. Generate AI summary explanation of results
    results_str = str(exec_res["rows"][:5]) # send top 5 rows summary to LLM to save tokens
    explanation = gemini_service.explain_results(
        question=req.message,
        sql=sql_query,
        results_summary=results_str,
        api_key=api_key,
        is_mocked=is_mocked
    )

    return {
        "success": True,
        "sql": sql_query,
        "columns": exec_res["columns"],
        "rows": exec_res["rows"],
        "count": exec_res["count"],
        "explanation": explanation,
        "is_mocked": is_mocked,
        "api_error": error_detail,
        "duration_ms": execution_duration
    }

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    table_name: Optional[str] = Form(None)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
        
    ext = os.path.splitext(file.filename)[1].lower()
    
    # Generate table name if not provided
    if not table_name:
        table_name = os.path.splitext(file.filename)[0].lower()
        table_name = table_name.replace(" ", "_").replace("-", "_")
        if table_name[0].isdigit():
            table_name = "t_" + table_name

    try:
        # For CSV or Excel, load into pandas
        if ext in [".csv", ".xlsx", ".xls"]:
            contents = await file.read()
            if ext == ".csv":
                df = pd.read_csv(io.BytesIO(contents), low_memory=False)
            else:
                df = pd.read_excel(io.BytesIO(contents))
                
            if not db_manager.engine:
                raise Exception("Database not connected. Please connect a database first.")
                
            # Write to database
            df.to_sql(table_name, db_manager.engine, if_exists="replace", index=False)
            return {
                "status": "success",
                "message": f"Successfully loaded file '{file.filename}' into table '{table_name}' ({len(df)} rows)."
            }
            
        elif ext == ".db" or ext == ".sqlite":
            # For SQLite db file, save it locally and connect
            save_path = os.path.join(os.getcwd(), file.filename)
            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Switch to this sqlite db
            db_manager.connect_sqlite(save_path)
            return {
                "status": "success",
                "message": f"Successfully uploaded and connected to SQLite database '{file.filename}'."
            }
            
        elif ext == ".sql":
            # Handle SQL dump file (execute statements)
            contents = (await file.read()).decode("utf-8")
            statements = contents.split(";")
            
            if not db_manager.engine:
                raise Exception("Database not connected.")
                
            with db_manager.engine.begin() as conn:
                for stmt in statements:
                    if stmt.strip():
                        conn.execute(stmt)
                        
            return {
                "status": "success",
                "message": f"Successfully executed SQL dump statements from '{file.filename}'."
            }
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file format: {ext}")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/analytics")
async def get_db_analytics():
    db_stats = db_manager.get_analytics()
    
    # Calculate query statistics from history
    total_queries = len(query_history)
    avg_query_time = sum(q["duration_ms"] for q in query_history) / total_queries if total_queries > 0 else 0
    
    # Table query frequencies
    table_counts = {}
    for q in query_history:
        tbl = q["table"]
        table_counts[tbl] = table_counts.get(tbl, 0) + 1
        
    most_queried = [{"name": name, "queries": count} for name, count in table_counts.items()]
    most_queried = sorted(most_queried, key=lambda x: x["queries"], reverse=True)[:5]
    
    # Default initial analytics if history is empty
    if not most_queried and db_stats["tables"]:
        most_queried = [{"name": t["name"], "queries": 0} for t in db_stats["tables"][:5]]

    return {
        "stats": db_stats,
        "queries": {
            "total": total_queries,
            "avg_time_ms": avg_query_time,
            "recent": query_history[-10:],  # last 10 queries
            "most_queried_tables": most_queried
        }
    }

# Serve frontend static assets in production
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.join(os.getcwd(), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
    
    # Catch-all router for React SPA client routing
    @app.exception_handler(404)
    async def not_found_exception_handler(request, exc):
        return FileResponse(os.path.join(frontend_dist, "index.html"))
