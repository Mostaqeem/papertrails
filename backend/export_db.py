import os
import django
import pandas as pd
from django.db import connection

# 1. Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings') # <-- Update this!
django.setup()

def export_to_excel(output_filename="database_export.xlsx"):
    # Get all table names from the database
    table_names = connection.introspection.table_names()
    
    print(f"Found {len(table_names)} tables. Starting export...")

    # Create an Excel writer object
    with pd.ExcelWriter(output_filename, engine='openpyxl') as writer:
        for table_name in table_names:
            try:
                # Read table into a DataFrame
                query = f"SELECT * FROM `{table_name}`"
                df = pd.read_sql_query(query, connection)
                
                # Sheet names have a 31-character limit in Excel
                sheet_name = table_name[:31]
                
                # Write to a specific sheet
                df.to_excel(writer, sheet_name=sheet_name, index=False)
                print(f"Successfully exported: {table_name}")
                
            except Exception as e:
                print(f"Could not export {table_name}: {e}")

    print(f"\nDone! Your database has been exported to {output_filename}")

if __name__ == "__main__":
    export_to_excel()