# This script connects to a PostgreSQL database and inserts data from a CSV file into a table

import psycopg2
import pandas as pd

data = pd.read_csv("./data/peace_observatory(negotiations).csv", delimiter=";", encoding="utf-8")  


data['description'] = data['description'].apply(
    lambda x: x.encode('utf-8', 'ignore').decode('utf-8') if isinstance(x, str) else x
)
# Connect to PostgreSQL
conn = psycopg2.connect(
    dbname="thesisdb",
    user="admin",
    password="admin",
    host="localhost",
    port="5432"  # Default PostgreSQL port
)

# Create a cursor to interact with the database
cur = conn.cursor()
dates = []
for _, row in data.iterrows():
    if pd.isnull(row['year_agreement']):
        dates.append(None)
    elif pd.isnull(row['month_agreement']):
        dates.append(f"{int(row['year_agreement']):04d}-01-01")
    elif pd.isnull(row['day_agreement']):
        dates.append(f"{int(row['year_agreement']):04d}-{int(row['month_agreement']):02d}-01")
    else:
        dates.append(f"{int(row['year_agreement']):04d}-{int(row['month_agreement']):02d}-{int(row['day_agreement']):02d}")


data['constructed_date'] = dates

# Example: Insert data

for _, row in data.iterrows():
    cur.execute(
        """
        INSERT INTO negotiations (negotiation_id, description, date)
        VALUES (%s, %s, %s)
        ON CONFLICT (negotiation_id) DO NOTHING;  -- Avoid duplicate entries
        """,
        (row['negotiation_id'], row['description'], row['constructed_date'])
    )

cur.execute("SELECT * FROM negotiations;")
rows = cur.fetchall()

# Print the rows
for row in rows:
    print(row)

# Commit changes and close
conn.commit()
cur.close()
conn.close()
