import os
import sqlite3
import pymysql
import pandas as pd
from langchain_community.utilities import SQLDatabase
from sqlalchemy import create_engine

class DatabaseManager:
    def __init__(self):
        self.db_type = "mysql"  # default
        self.mysql_config = {
            "host": os.environ.get("DB_HOST", "127.0.0.1"),
            "port": int(os.environ.get("DB_PORT", 3306)),
            "username": os.environ.get("DB_USER", "root"),
            "password": os.environ.get("DB_PASSWORD", ""),
            "database": os.environ.get("DB_NAME", "")
        }
        self.sqlite_path = "querychat_demo.db"
        self.db = None
        self.engine = None
        
        # Auto-initialize and seed SQLite demo db
        self.seed_sqlite_demo()
        # Connect to MySQL by default since it is running and has data
        self.connect_mysql()

    def seed_sqlite_demo(self):
        """Seeds the local SQLite database from the Data_CSV directory if CSVs exist"""
        csv_dir = "Data_CSV"
        if not os.path.exists(csv_dir):
            csv_dir = os.path.join("..", "Data_CSV")
            if not os.path.exists(csv_dir):
                print("Data_CSV directory not found. Skipping SQLite seeding.")
                return

        print("Seeding SQLite demo database from CSVs...")
        try:
            conn = sqlite3.connect(self.sqlite_path)
            for file_name in os.listdir(csv_dir):
                if file_name.endswith(".csv"):
                    file_path = os.path.join(csv_dir, file_name)
                    # Normalize table name: e.g. "2017_Budgets.csv" -> "budgets_2017" or similar
                    table_name = os.path.splitext(file_name)[0].lower()
                    table_name = table_name.replace(" ", "_").replace("-", "_")
                    
                    # Avoid leading numbers in table names for SQL safety
                    if table_name[0].isdigit():
                        table_name = "t_" + table_name
                        
                    # Load CSV into SQLite
                    print(f"Loading {file_name} into table '{table_name}'...")
                    # Read with low_memory=False to avoid DtypeWarning
                    df = pd.read_csv(file_path, low_memory=False)
                    df.to_sql(table_name, conn, if_exists="replace", index=False)
            conn.close()
            print("SQLite demo database seeded successfully!")
        except Exception as e:
            print(f"Failed to seed SQLite demo database: {e}")

    def connect_mysql(self, host=None, port=None, username=None, password=None, database=None):
        if host is not None:
            self.mysql_config = {
                "host": host,
                "port": int(port or 3306),
                "username": username,
                "password": password,
                "database": database
            }
        
        cfg = self.mysql_config
        mysql_uri = f"mysql+pymysql://{cfg['username']}:{cfg['password']}@{cfg['host']}:{cfg['port']}/{cfg['database']}"
        
        try:
            # Test direct connection first
            conn = pymysql.connect(
                host=cfg['host'],
                port=cfg['port'],
                user=cfg['username'],
                password=cfg['password'],
                database=cfg['database']
            )
            conn.close()
            
            # Setup Langchain SQLDatabase wrapper
            self.db = SQLDatabase.from_uri(mysql_uri, sample_rows_in_table_info=1)
            self.engine = create_engine(mysql_uri)
            self.db_type = "mysql"
            print(f"Connected to MySQL database '{cfg['database']}'")
            return {"status": "success", "message": f"Connected to MySQL database '{cfg['database']}'"}
        except Exception as e:
            print(f"Failed to connect to MySQL: {e}")
            return {"status": "error", "message": str(e)}

    def connect_sqlite(self, filepath=None):
        if filepath:
            self.sqlite_path = filepath
        
        sqlite_uri = f"sqlite:///{self.sqlite_path}"
        try:
            # Test connection
            conn = sqlite3.connect(self.sqlite_path)
            conn.close()
            
            self.db = SQLDatabase.from_uri(sqlite_uri, sample_rows_in_table_info=1)
            self.engine = create_engine(sqlite_uri)
            self.db_type = "sqlite"
            print(f"Connected to SQLite database '{self.sqlite_path}'")
            return {"status": "success", "message": f"Connected to SQLite database '{self.sqlite_path}'"}
        except Exception as e:
            print(f"Failed to connect to SQLite: {e}")
            return {"status": "error", "message": str(e)}

    def execute_query(self, query: str):
        """Executes a SQL query and returns columns, rows, and row count"""
        if not self.engine:
            raise Exception("Database not connected.")
            
        # Strip trailing semicolon and white space
        query_clean = query.strip().rstrip(";")
        
        # Don't allow destructive modifications for safety (optional check)
        lower_query = query_clean.lower()
        if any(keyword in lower_query for keyword in ["drop ", "delete ", "truncate ", "insert into", "update "]):
            # If they really want it, we can allow it, but let's log it.
            pass
            
        try:
            # Use pandas to read the SQL query
            df = pd.read_sql(query_clean, self.engine)
            columns = list(df.columns)
            rows = df.values.tolist()
            # Convert NaN to None for JSON compliance
            rows = [[None if pd.isna(cell) else cell for cell in row] for row in rows]
            
            return {
                "status": "success",
                "columns": columns,
                "rows": rows,
                "count": len(rows),
                "sql": query
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "sql": query
            }

    def get_schema_info(self):
        """Returns the active schema info including table names and schemas"""
        if not self.db:
            return {}
        try:
            return self.db.get_table_info()
        except Exception as e:
            return f"Error reading schema: {e}"

    def get_tables_list(self):
        """Returns a list of tables and their row counts"""
        if not self.engine:
            return []
        try:
            tables = []
            if self.db_type == "mysql":
                query = f"SHOW TABLES FROM {self.mysql_config['database']}"
                df = pd.read_sql(query, self.engine)
                for tbl in df.iloc[:, 0]:
                    count_df = pd.read_sql(f"SELECT COUNT(*) FROM `{tbl}`", self.engine)
                    tables.append({"name": tbl, "rows": int(count_df.iloc[0, 0])})
            else:
                # SQLite
                query = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                df = pd.read_sql(query, self.engine)
                for tbl in df.iloc[:, 0]:
                    count_df = pd.read_sql(f"SELECT COUNT(*) FROM [{tbl}]", self.engine)
                    tables.append({"name": tbl, "rows": int(count_df.iloc[0, 0])})
            return tables
        except Exception as e:
            print("Error getting tables list:", e)
            return []

    def get_analytics(self):
        """Gathers database statistics for the analytics tab"""
        tables = self.get_tables_list()
        total_tables = len(tables)
        total_rows = sum(t["rows"] for t in tables)
        
        # SQLite metadata
        db_size_bytes = 0
        if self.db_type == "sqlite":
            if os.path.exists(self.sqlite_path):
                db_size_bytes = os.path.getsize(self.sqlite_path)
        else:
            # MySQL database size
            try:
                query = f"""
                SELECT SUM(data_length + index_length) 
                FROM information_schema.TABLES 
                WHERE table_schema = '{self.mysql_config['database']}'
                """
                df = pd.read_sql(query, self.engine)
                val = df.iloc[0, 0]
                db_size_bytes = int(val) if val is not None else 0
            except Exception as e:
                print("Error calculating MySQL size:", e)
                
        # Format size
        if db_size_bytes > 1024 * 1024:
            db_size_str = f"{db_size_bytes / (1024*1024):.2f} MB"
        else:
            db_size_str = f"{db_size_bytes / 1024:.2f} KB"

        return {
            "db_type": self.db_type,
            "total_tables": total_tables,
            "total_rows": total_rows,
            "db_size": db_size_str,
            "db_name": self.mysql_config['database'] if self.db_type == "mysql" else self.sqlite_path,
            "tables": tables
        }
