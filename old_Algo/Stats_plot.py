import pandas as pd
from datetime import datetime

def calculate_casualties_per_day(start_date, end_date, total_casualties):
    num_days = (end_date - start_date).days + 1
    return total_casualties / num_days

def generate_casualties_table(csv_file):
        df = pd.read_csv(csv_file)
        result = []

        for _, row in df.iterrows():
            start_date = datetime.strptime(row['date_start'], '%Y-%m-%d %H:%M:%S.%f').date()
            end_date = datetime.strptime(row['date_end'], '%Y-%m-%d %H:%M:%S.%f').date()
            total_casualties = row['deaths_a'] + row['deaths_b']
            daily_casualties = calculate_casualties_per_day(start_date, end_date, total_casualties)

            current_date = start_date
            while current_date <= end_date:
                result.append({
                    'date': current_date.strftime('%Y-%m-%d'),
                    'country': row['country'],
                    'daily_casualties': daily_casualties,
                    'dyad_id': row['dyad_new_id']
                })
                current_date += pd.Timedelta(days=1)


    # Sort by date and country
        result_df = pd.DataFrame(result)
        aggregated_df = result_df.groupby(['date', 'country'], as_index=False).sum()
        return aggregated_df[['date', 'country', 'daily_casualties', 'dyad_id']]


generate_casualties_table('GEDEvent_v24_1.csv').to_csv('casualties.csv', index=False)
    # Example usage:
    # new_table = generate_casualties_table('/c:/Users/ymont/Desktop/Thesis/conflicts.csv')
    # new_table.to_csv('/c:/Users/ymont/Desktop/Thesis/daily_casualties.csv', index=False)