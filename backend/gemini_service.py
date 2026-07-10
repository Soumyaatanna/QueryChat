import os
import re
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

class GeminiService:
    def __init__(self, db_manager):
        self.db_manager = db_manager

    def get_llm(self, api_key: str = None):
        """Initializes and returns the Gemini LLM instance"""
        key = api_key or os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
        if not key:
            raise ValueError("No Gemini API Key provided or found.")
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            api_key=key,
            temperature=0
        )

    def generate_sql(self, question: str, api_key: str = None):
        """Translates natural language to SQL based on active schema, with robust heuristics fallback on rate-limits"""
        schema = self.db_manager.get_schema_info()
        db_type = self.db_manager.db_type
        
        try:
            llm = self.get_llm(api_key)
            template = """Based on the table schema below, write a SQL query that would answer the user's question.
Remember : Only provide me the SQL query in a single line, do not include anything else. Do not include markdown code block formatting (like ```sql).
Table Schema:
{schema}

Question: {question}
SQL Query:
"""
            prompt = ChatPromptTemplate.from_template(template)
            
            def get_schema(_):
                return schema

            chain = (
                RunnablePassthrough.assign(schema=get_schema)
                | prompt
                | llm.bind(stop=["\nSQLResult:"])
                | StrOutputParser()
            )
            
            print(f"Calling Gemini for SQL generation: '{question}'")
            response = chain.invoke({"question": question})
            query = response.strip()
            
            # Remove markdown syntax if the LLM output it anyway
            match = re.search(r"```sql\s*(.*?)\s*```", query, re.DOTALL | re.IGNORECASE)
            if match:
                query = match.group(1).strip()
            else:
                query = query.replace("```sql", "").replace("```", "").strip()
                
            return {
                "status": "success",
                "sql": query,
                "is_mocked": False
            }
            
        except Exception as e:
            # Check if this is a quota / 429 error
            err_msg = str(e)
            print(f"Gemini API Error: {err_msg}")
            
            # Fallback to local heuristic parsing
            print("Falling back to local heuristic SQL generator...")
            mock_sql = self._generate_heuristic_sql(question)
            return {
                "status": "fallback",
                "sql": mock_sql,
                "is_mocked": True,
                "error": "Gemini API Quota Exceeded (429). Generating simulated SQL query." if "quota" in err_msg.lower() or "429" in err_msg else f"API Error: {err_msg}. Using heuristics."
            }

    def explain_results(self, question: str, sql: str, results_summary: str, api_key: str = None, is_mocked: bool = False):
        """Summarizes query results in plain English, with a fallback explanation on rate-limits"""
        if is_mocked:
            return self._generate_heuristic_explanation(question, sql, results_summary)
            
        try:
            llm = self.get_llm(api_key)
            template = """Based on the question, the SQL query executed, and the results from the database, write a brief, insightful summary explaining what the data shows in plain English.
Keep it concise (2-4 sentences).

Question: {question}
SQL Query: {sql}
Database Results: {results}

Summary:
"""
            prompt = ChatPromptTemplate.from_template(template)
            chain = prompt | llm | StrOutputParser()
            
            print("Calling Gemini for results explanation...")
            explanation = chain.invoke({
                "question": question,
                "sql": sql,
                "results": results_summary
            })
            return explanation.strip()
            
        except Exception as e:
            print(f"Gemini Explanation Error: {e}")
            return self._generate_heuristic_explanation(question, sql, results_summary)

    def _generate_heuristic_sql(self, question: str):
        """Applies keyword rules to generate SQL for common queries when Gemini is unavailable"""
        q = question.lower()
        tables = self.db_manager.get_tables_list()
        table_names = [t["name"] for t in tables]
        
        # Determine active database target tables
        users_table = next((t for t in table_names if "user" in t), None)
        bookings_table = next((t for t in table_names if "booking" in t or "book" in t), None)
        products_table = next((t for t in table_names if "product" in t), None)
        budgets_table = next((t for t in table_names if "budget" in t), None)
        customers_table = next((t for t in table_names if "customer" in t), None)
        regions_table = next((t for t in table_names if "region" in t), None)
        sales_table = next((t for t in table_names if "sale" in t or "order" in t), None)

        # Heuristic 1: Count queries
        if "how many" in q or "count" in q:
            for keyword, table in [("user", users_table), ("booking", bookings_table), ("book", bookings_table), 
                                   ("product", products_table), ("budget", budgets_table), ("customer", customers_table), 
                                   ("region", regions_table), ("order", sales_table), ("sale", sales_table)]:
                if keyword in q and table:
                    return f"SELECT COUNT(*) as total FROM `{table}`"
            
            # Default to first table if we see "records" or "rows"
            if len(table_names) > 0:
                return f"SELECT COUNT(*) as total FROM `{table_names[0]}`"

        # Check for starts-with, ends-with, or contains filters
        like_filter = ""
        starts_match = re.search(r"starts? with (?:letter\s+)?['\"](\w+)['\"]", q)
        if starts_match:
            char = starts_match.group(1)
            like_filter = f"LIKE '{char}%'"
        else:
            ends_match = re.search(r"ends? with (?:letter\s+)?['\"](\w+)['\"]", q)
            if ends_match:
                char = ends_match.group(1)
                like_filter = f"LIKE '%{char}'"
            else:
                contains_match = re.search(r"contains?\s+['\"](\w+)['\"]", q)
                if contains_match:
                    char = contains_match.group(1)
                    like_filter = f"LIKE '%{char}%'"

        # Heuristic 2: Select all/show table queries
        for keyword, table in [("user", users_table), ("booking", bookings_table), ("book", bookings_table), 
                               ("product", products_table), ("budget", budgets_table), ("customer", customers_table), 
                               ("region", regions_table), ("order", sales_table), ("sale", sales_table)]:
            if table and (keyword in q or table in q):
                # Check for columns
                if "name" in q:
                    name_col = "username" if table == users_table else ("Customer Names" if "customer" in table else ("Product Name" if "product" in table or "budget" in table else "name"))
                    if like_filter:
                        return f"SELECT `{name_col}` FROM `{table}` WHERE `{name_col}` {like_filter} LIMIT 25"
                    return f"SELECT `{name_col}` FROM `{table}` LIMIT 25"
                
                if like_filter:
                    filter_col = "username" if table == users_table else "name"
                    return f"SELECT * FROM `{table}` WHERE `{filter_col}` {like_filter} LIMIT 25"
                return f"SELECT * FROM `{table}` LIMIT 25"

        # Heuristic 3: Budget query specific to demo data
        if "budget" in q and budgets_table:
            if "product 12" in q:
                return f"SELECT `2017 Budgets` FROM `{budgets_table}` WHERE `Product Name` = 'Product 12'"
            return f"SELECT `Product Name`, `2017 Budgets` FROM `{budgets_table}` LIMIT 10"

        # Heuristic 4: Default fallback
        if len(table_names) > 0:
            return f"SELECT * FROM `{table_names[0]}` LIMIT 10"
            
        return "SELECT 1"

    def _generate_heuristic_explanation(self, question: str, sql: str, results_summary: str):
        """Generates a plain English explanation when Gemini is unavailable"""
        # If result is simple count
        if "COUNT(*)" in sql or "count" in sql.lower():
            try:
                # Extract number from results_summary (which is typically string list representation like '[(5,)]' or '[[5]]')
                nums = re.findall(r'\d+', results_summary)
                if nums:
                    count_val = nums[0]
                    return f"Based on the database records, the total count is {count_val}. The query successfully scanned the table to aggregate these records."
            except:
                pass
                
        # Generic response
        return f"Successfully queried the database and retrieved matching rows. The generated SQL query was: `{sql}`. You can see the resulting data formatted in the table above."
