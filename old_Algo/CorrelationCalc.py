import pandas as pd
from scipy.stats import wilcoxon
# Load the casualties data
casualties_df = pd.read_csv('casualties.csv')

# Load the negotiations data
negotiations_df = pd.read_csv('peace_observatory(negotiations).csv', delimiter=';')
negotiations_df['start_negotiations_day'].fillna(1)
negotiations_df['end_negotiations_day'].fillna(28)
negotiations_df['start_negotiations_month'].fillna(1)
negotiations_df['end_negotiations_month'].fillna(12)


negotiations_df = negotiations_df[
    (negotiations_df['start_negotiations_year'] < 2025) & (negotiations_df['start_negotiations_year'] > 1000) &
    (negotiations_df['start_negotiations_month'] > 0) & (negotiations_df['start_negotiations_month'] <= 12) &
    (negotiations_df['start_negotiations_day'] > 0) & (negotiations_df['start_negotiations_day'] <= 31) &
    (negotiations_df['end_negotiations_year'] < 2025) & (negotiations_df['end_negotiations_year'] > 1000) &
    (negotiations_df['end_negotiations_month'] > 0) & (negotiations_df['end_negotiations_month'] <= 12) &
    (negotiations_df['end_negotiations_day'] > 0) & (negotiations_df['end_negotiations_day'] <= 31)
]

# Convert date columns to datetime
negotiations_df['start_negotiations_year'] = negotiations_df['start_negotiations_year'].astype(int)
negotiations_df['start_negotiations_month'] = negotiations_df['start_negotiations_month'].astype(int)
negotiations_df['start_negotiations_day'] = negotiations_df['start_negotiations_day'].astype(int)
negotiations_df['end_negotiations_year'] = negotiations_df['end_negotiations_year'].astype(int)
negotiations_df['end_negotiations_month'] = negotiations_df['end_negotiations_month'].astype(int)
negotiations_df['end_negotiations_day'] = negotiations_df['end_negotiations_day'].astype(int)

casualties_df['date'] = pd.to_datetime(casualties_df['date'])
negotiations_df['negotiation_start'] = pd.to_datetime(negotiations_df[['start_negotiations_year', 'start_negotiations_month', 'start_negotiations_day']].astype(str).agg('-'.join, axis=1))
negotiations_df['negotiation_end'] = pd.to_datetime(negotiations_df[['end_negotiations_year', 'end_negotiations_month', 'end_negotiations_day']].astype(str).agg('-'.join, axis=1))
# Merge the data
merged_df = pd.merge(casualties_df, negotiations_df, how='left', left_on='dyad_id', right_on='dyad_id')

# Define a function to categorize the period
def categorize_period(row):
    if pd.isna(row['negotiation_start']) or pd.isna(row['negotiation_end']):
        return 'no_negotiation'
    elif row['date'] < row['negotiation_start']:
        return 'before_negotiation'
    elif row['negotiation_start'] <= row['date'] <= row['negotiation_end']:
        return 'during_negotiation'
    else:
        return 'after_negotiation'

# Apply the function to categorize the period
merged_df['period'] = merged_df.apply(categorize_period, axis=1)

# Group by period and calculate the mean daily casualties
trend_df = merged_df.groupby(['country', 'period'])['daily_casualties'].mean().reset_index()

# Pivot the table to have periods as columns
trend_pivot_df = trend_df.pivot(index='country', columns='period', values='daily_casualties').reset_index()

# Calculate the trend by comparing the mean daily casualties between different periods
trend_pivot_df['before_vs_during'] = trend_pivot_df['during_negotiation'] - trend_pivot_df['before_negotiation']
trend_pivot_df['during_vs_after'] = trend_pivot_df['after_negotiation'] - trend_pivot_df['during_negotiation']
trend_pivot_df['before_vs_after'] = trend_pivot_df['after_negotiation'] - trend_pivot_df['before_negotiation']

# Save the trend results to a CSV file
trend_pivot_df.to_csv('trend_results.csv', index=False)

global_trend = trend_pivot_df.mean(numeric_only=True)
global_trend.to_csv('../Old data/global_trend_results.csv', header=True)

