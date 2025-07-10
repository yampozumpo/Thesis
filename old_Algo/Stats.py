import pandas as pd
import chardet


# Read the first CSV file
df1 = pd.read_csv('GEDEvent_v24_1.csv', encoding='utf-8', on_bad_lines='warn')

# Read the second CSV file
df2 = pd.read_csv('peace_observatory(negotiations).csv', encoding='windows-1252', delimiter=';', on_bad_lines='warn')

# Join the two dataframes
joined_df = df1.merge(df2, left_on='dyad_new_id', right_on='dyad_id', how='inner')


# Write the joined dataframe to a new CSV file
result_df = joined_df[['dyad_new_id', 'date_start', 'date_end', 'deaths_a', 'deaths_b', 'country', 'negotiation_id']]

result_df.to_csv('joined_file.csv', index=False) 