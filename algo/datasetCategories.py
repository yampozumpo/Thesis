## This script categorizes data from a CSV file into different categories based on predefined sets of actors, phases, and goals.

import pandas as pd

categoriesActors = {
    'Category': ['International and Regional Actors', 'National State Actors', 'Local and Informal Actors', 'Drop'],
    'Candidates': [ ["international_ngo", "regional_organization", "international_organization",
                     "peace_operation", "foreign_government", "language_organization"],
                    ["national_committee", "local_government", "government",
                    "president", "political_party", "government_forces",
                    "police"], 
                    ["local_ngo", "armed_group", "community_leaders",
                    "religious_leaders", "religious_any", "traditional_leaders",
                    "local_committee"],
                    ["company", "women", "individual"]]
}

categoriesPhases = {
    'Category': ['prenego', 'nego', 'nego_implement'],
}

categoriesGoal = {
    'Category': ['Cessation of Hostilities and Security', 'Political Power and Governance', 'Post-Conflict Justice and Social Healing', 'Resource Management and Economic Issues', 'External Involvement and Military Presence', 'Unspecified', 'Drop'],    
    'Candidates': [["nego_ceasefire", "nego_ddr", "monitor"],
                   ["nego_agreement", "nego_power-sharing", "election"],
                   ["reconciliation", "amnesty"],
                   ["nego_land", "nego_water", "nego_cattle", "nego_movement"],
                   ["nego_end_support", "nego_withdrawal_success"],
                   ["nego_unspecified"],
                   ["nego_continue", "nego_end", "border"]

    ]
}

def categorize_data_actors(df, categories_dict):
    df['Category_Actors'] = [[] for _ in range(len(df))]
    for category, candidates in zip(categories_dict['Category'], categories_dict['Candidates']):
        for candidate in candidates:
            df.loc[(df[candidate] == 1) & (category != 'drop'), 'Category_Actors'] = df.loc[df[candidate] == 1, 'Category_Actors'].apply(lambda x: x + [category] if category not in x else x)
    df['Category_Actors'] = df['Category_Actors'].apply(lambda x: x if x else ['Non-Mediated'])
    return df

def categorize_data_phases(df, categories_dict):
    df['Category_Phases'] = [[] for _ in range(len(df))]
    for category in categories_dict['Category']:
        df.loc[df[category] == 1, 'Category_Phases'] = category
    return df

def categorize_data_goal(df, categories_dict):
    df['Category_Goal'] = [[] for _ in range(len(df))]
    for category, candidates in zip(categories_dict['Category'], categories_dict['Candidates']):
        for candidate in candidates:
            df.loc[(df[candidate] == 1) & (category != 'drop'), 'Category_Goal'] = df.loc[df[candidate] == 1, 'Category_Goal'].apply(lambda x: x + [category] if category not in x else x)
    df['Category_Goal'] = df['Category_Goal'].apply(lambda x: x if x else ['Drop'])
    return df
    

def main():
    # Load the CSV file
    df = pd.read_csv('./data/peace_observatory(negotiations).csv', delimiter=';')

    # Categorize based on Actors
    df = categorize_data_actors(df, categoriesActors)

    df = categorize_data_phases(df, categoriesPhases)
    # Categorize based on Goal
    df = categorize_data_goal(df, categoriesGoal)

    # Exclude "Drop" from each category list
    categoriesActorsFiltered = [category for category in categoriesActors['Category'] if category != 'Drop'] + ['Non-Mediated']
    categoriesPhasesFiltered = [category for category in categoriesPhases['Category'] if category != 'Drop']
    categoriesGoalFiltered = [category for category in categoriesGoal['Category'] if category != 'Drop']

    df['global_category'] = [[] for _ in range(len(df))]
    counter = 1

    for category1 in categoriesActorsFiltered:
        for category2 in categoriesPhasesFiltered:
            for category3 in categoriesGoalFiltered:
                # Create a mask for rows matching the current combination
                mask = (
                    df['Category_Actors'].apply(lambda x: category1 in x) &
                    (df['Category_Phases'] == category2) &
                    df['Category_Goal'].apply(lambda x: category3 in x)
                )
                # Update the global_category column for matching rows
                df.loc[mask, 'global_category'] = df.loc[mask, 'global_category'].apply(
                    lambda x: x + [counter]
                )
                counter += 1
    # Save the selected data to a new CSV file
    # Select only the desired columns
    columns_to_save = ['dyad_id', 'Category_Actors', 'Category_Goal', 'Category_Phases', 'global_category']
    df_selected = df[columns_to_save]

    df_selected.to_csv('./data/categories.csv', index=False)
    # Save only the 'Category_Actors' column to a new CSV file

if __name__ == "__main__":
    main()