import os
import re
import getpass
from langchain_community.utilities import SQLDatabase
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

def main():
    print("=== QueryChat AI - Existing Project Runner ===")
    
    # Load .env manually if it exists
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    k, v = line.strip().split("=", 1)
                    os.environ[k.strip()] = v.strip()

    # 1. Connect to MySQL Database
    host = os.environ.get("DB_HOST", "localhost")
    port = os.environ.get("DB_PORT", "3306")
    username = os.environ.get("DB_USER", "root")
    password = os.environ.get("DB_PASSWORD", "")
    database = os.environ.get("DB_NAME", "restro")
    
    mysql_uri = f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"
    print(f"Connecting to database '{database}' at {host}:{port}...")
    try:
        db = SQLDatabase.from_uri(mysql_uri, sample_rows_in_table_info=1)
        print("Connected successfully!")
        print("Available tables:", db.get_usable_table_names())
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        return

    # 2. Get API Key
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("\nGoogle Gemini API Key is required to run the AI model.")
        api_key = getpass.getpass("Please enter your Google Gemini API Key: ").strip()
        if not api_key:
            print("API Key cannot be empty. Exiting.")
            return
        os.environ["GOOGLE_API_KEY"] = api_key

    # 3. Setup Gemini LLM
    print("\nInitializing Gemini model (gemini-2.0-flash)...")
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            api_key=api_key,
            temperature=0
        )
    except Exception as e:
        print(f"Error initializing Gemini: {e}")
        return

    # 4. Setup Prompt and Chain
    template = """Based on the table schema below, write a SQL query that would answer the user's question:
Remember : Only provide me the sql query dont include anything else.
           Provide me sql query in a single line dont add line breaks.
Table Schema:
{schema}

Question: {question}
SQL Query:
"""
    prompt = ChatPromptTemplate.from_template(template)

    def get_schema(_):
        return db.get_table_info()

    sql_chain = (
        RunnablePassthrough.assign(schema=get_schema)
        | prompt
        | llm.bind(stop=["\nSQLResult:"])
        | StrOutputParser()
    )

    print("\nSetup complete! You can now query your database in natural language.")
    print("Type 'exit' or 'quit' to stop.")
    
    while True:
        try:
            question = input("\nAsk a question about 'restro' database: ").strip()
            if not question:
                continue
            if question.lower() in ['exit', 'quit']:
                print("Exiting. Goodbye!")
                break
            
            print("Generating SQL query...")
            response = sql_chain.invoke({"question": question})
            
            # Clean response to get raw SQL
            query = response.strip()
            # Remove markdown formatting if present
            match = re.search(r"```sql\s*(.*?)\s*```", query, re.DOTALL | re.IGNORECASE)
            if match:
                query = match.group(1).strip()
            else:
                query = query.replace("```sql", "").replace("```", "").strip()
            
            print(f"\nGenerated SQL:\n{query}")
            
            print("\nExecuting query on 'restro' database...")
            results = db.run(query)
            print("Results:")
            print(results)
            
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
