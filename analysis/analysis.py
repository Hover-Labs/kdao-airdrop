from collections import defaultdict

import requests
import csv
from io import StringIO
from xtz_analysis_clusters import xtz_analysis_clusters
from funding_source_analysis_clusters import funding_source_analysis_clusters

flatten = lambda t: [item for sublist in t for item in sublist]

requested_preferred_addresses = [
    'tz1fL2TsQR271w84MXx3qFD7y4PZ1F2mpHFA',  # Cluster 23, requested via Discord
    'tz1cZg2dY1NZka5vJfcACh8owd9Pt5E28pNP',  # Cluster 9/10, requested via Discrod
]

def fetch_category(url, name):
    print("Fetching {}".format(name))
    airdrop_data = requests.get(url)
    cleaned_data = [x.strip().rstrip(',').replace(', ', ',') for x in airdrop_data.content.decode().split('\n') if x]

    data_strio = StringIO('\n'.join(cleaned_data))

    addresses = {}

    for airdrop_recipient in csv.DictReader(data_strio):
        addresses[airdrop_recipient['address']] = int(airdrop_recipient['points'])

    return addresses

datasets = {
    'Dexter_LP': fetch_category('https://raw.githubusercontent.com/Hover-Labs/kdao-airdrop/main/dexter-lps.csv', "Dexter LP list"),
    'Gov_Executor': fetch_category('https://raw.githubusercontent.com/Hover-Labs/kdao-airdrop/main/governance.csv', "Gov Executor list"),
    'Kolibri_LP': fetch_category('https://raw.githubusercontent.com/Hover-Labs/kdao-airdrop/main/kolibri-lps.csv', "Kolibri LP list"),
    'Protocol_User': fetch_category('https://raw.githubusercontent.com/Hover-Labs/kdao-airdrop/main/oven-borrowers.csv', "Protocol User list"),
    'Quipu_LP_New': fetch_category('https://raw.githubusercontent.com/Hover-Labs/kdao-airdrop/main/quipu-lps-new.csv', "Quipuswap (new) list"),
    'Quipu_LP_Old': fetch_category('https://raw.githubusercontent.com/Hover-Labs/kdao-airdrop/main/quipu-lps-old.csv', "Quipuswap (old) list"),
}

clusters_to_remove_from_funding_analysis = set()

final_clusters = {}

for xtz_analysis_cluster, xtz_analysis_addresses in xtz_analysis_clusters.items():
    final_clusters["xtz_analysis_" + xtz_analysis_cluster] = xtz_analysis_addresses
    for funding_analysis_cluster, funding_analysis_addresses in funding_source_analysis_clusters.items():
        intersection = xtz_analysis_addresses.intersection(funding_analysis_addresses)
        if len(intersection) > 0:
            similarity = len(intersection) / len(xtz_analysis_addresses)
            if similarity == 1:
                clusters_to_remove_from_funding_analysis.add(funding_analysis_cluster)
            # if similarity < 1:
            #     print("Cluster (xtz analysis {}) and (funding analysis {}) are similar ({}%)".format(xtz_analysis_cluster, funding_analysis_cluster, similarity * 100))
            #     print("  - LEFT: ", xtz_analysis_addresses.difference(funding_analysis_addresses))
            #     print("  - RIGHT: ", funding_analysis_addresses.difference(xtz_analysis_addresses))

for funding_analysis_cluster, funding_analysis_addresses in funding_source_analysis_clusters.items():
    if funding_analysis_cluster not in clusters_to_remove_from_funding_analysis:
        final_clusters["funding_analysis_" + funding_analysis_cluster] = funding_analysis_addresses

blacklist = set()
airdrop_replacements = {}
for cluster_name, cluster_addreses in final_clusters.items():
    cluster_activities = set()

    cluster_activity_map = defaultdict(list)

    for activity, collection in datasets.items():
        for address in cluster_addreses:
            if address in collection:
                cluster_activity_map[address].append(activity)
                cluster_activities.add(activity)

    sorted_addresses = sorted(cluster_activity_map, key=lambda k: len(cluster_activity_map[k]), reverse=True)

    # If we have a preferred address to override
    preferred_address = next((address for address in cluster_addreses if address in requested_preferred_addresses), None)
    if preferred_address is not None:
        to_be_airdropped = preferred_address
        to_be_blacklisted = set(sorted_addresses) - set([preferred_address])
    else:
        to_be_airdropped, to_be_blacklisted = sorted_addresses[0], set(sorted_addresses[1:])

    blacklist = blacklist.union(to_be_blacklisted)

    airdrop_replacements[to_be_airdropped] = len(cluster_activities)

blacklist = blacklist.union({
 'tz1Mdtt1jtPiMmKVSDbB2PRHVVRcVStayanS',
 'tz1Mqnms73LqgBCYiM7e5k12VyWNQG8ytcGb',
 'tz1UKJ6X9pfAneU62ndcXukNL3rPzxCskT6K',
 'tz1VmeVuNCpwi3uuhBGWpYFk1Qx8UKYpZsJi',
 'tz1eDj5UuChVcZpA7gofUtyVS6mdQAcyEbZ5',
 'tz1hoverof3f2F8NAavUyTjbFBstZXTqnUMS',
})

point_totals = {}
for activity, collection in datasets.items():
    participating_addresses = set(collection.keys())

    filtered_addresses = participating_addresses - blacklist

    for address in filtered_addresses:
        if address not in point_totals:
            point_totals[address] = 1
        else:
            point_totals[address] += 1

for address, replacement_value in airdrop_replacements.items():
    point_totals[address] = replacement_value

total_points = sum(point_totals.values())

# 150,000 kDAO earmarked for the airdrop
TOKEN_ALLOCATION = 150_000

split_per_point = TOKEN_ALLOCATION / total_points

print('New point allocation per address {}'.format(split_per_point))

csv_header = ['address, token_allocation']
csv_data = []
for address, points in point_totals.items():
    csv_data += ["{}, {}".format(address, points * split_per_point)]

with open('airdrop-data.csv', 'w') as f:
    f.write('\n'.join(csv_header + sorted(csv_data, key=str.casefold)))

print("Wrote airdrop data to airdrop-data.csv")
