import pandas as pd

def filter_data(input_file, output_file, conditions):
    # Read the CSV file
    df = pd.read_csv(input_file, delimiter=';')
    # Create a mask to filter out rows
    mask = (df['bilateral_negotiations'] == 1) & df[list(conditions.keys())].eq(1).any(axis=1)
    # Filter the DataFrame
    mask = mask | df[list(blacklist.keys())].eq(1).any(axis=1)
    df_filtered = df[~mask]
    # Write the filtered data to a new CSV file
    df_filtered.to_csv(output_file, index=False)

input_file = 'peace_observatory(negotiations).csv'
output_file = 'filtered_data.csv'
    
    # Define the conditions for filtering
conditions = {
        'bilateral_negotiations': '1',
        'local_ngo': '1',
        'international_ngo': '1',
        'regional_organization': '1',
        'peace_operation': '1',
        'foreign_government': '1',
        'individual': '1',
        'national_committee': '1',
        'mediated_negotiations': '1',
        'international_organization': '1',
        'national_committee': '1',
        'language_organization': '1',
        'local_government': '1',
        'government': '1',
        'president': '1',
        'political_party': '1',
        'government_forces': '1',
        'police': '1',
        'armed_group': '1',
        'community_leaders': '1',
        'religious_leaders': '1',
        'religious_any': '1',
        'traditional_leaders': '1',
        'local_committee': '1',
        'company': '1',
        'women': '1',
}

blacklist = {
    'secret_nego':  1,
    'alleged_nego': 1,
    'nego_unspecified': 1,
    'one-sided_nego': 1,
    'exclusive_nego': 1,
    'women' : 1,
    'company': 1,
}

filter_data(input_file, output_file, conditions)