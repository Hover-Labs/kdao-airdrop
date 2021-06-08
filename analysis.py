import requests
import csv
from io import StringIO
from collections import defaultdict

flatten = lambda t: [item for sublist in t for item in sublist]

def fetch_category(url, name):
	print("Fetching {}".format(name))
	airdrop_data = requests.get(url)
	cleaned_data = [x.strip().rstrip(',').replace(', ', ',') for x in airdrop_data.content.decode().split('\n') if x]

	data_strio = StringIO('\n'.join(cleaned_data))

	addresses = {}

	mermaid_data = defaultdict()

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

BLACKLIST_URL = 'https://gist.githubusercontent.com/Fitblip/ebd7b1ace3c6eec2f9693e7d7d1cfb1a/raw/e895bda216e9f6e62d0f14cf1910041ca8e67f39/aggregated-blacklist.txt'
blacklisted_addresses = set(requests.get(BLACKLIST_URL).content.decode().split())

blacklisted_addresses = blacklisted_addresses.union(set([
 'tz1Mdtt1jtPiMmKVSDbB2PRHVVRcVStayanS',
 'tz1Mqnms73LqgBCYiM7e5k12VyWNQG8ytcGb',
 'tz1UKJ6X9pfAneU62ndcXukNL3rPzxCskT6K',
 'tz1VmeVuNCpwi3uuhBGWpYFk1Qx8UKYpZsJi',
 'tz1eDj5UuChVcZpA7gofUtyVS6mdQAcyEbZ5',
 'tz1hoverof3f2F8NAavUyTjbFBstZXTqnUMS',
]))

POINT_REPLACEMENTS_URL = 'https://gist.githubusercontent.com/Fitblip/f11f40c61d826310ee02d05fae1456cf/raw/9df3fbe39038287f541a5f7490b39e896d05c24d/replacements.txt'
point_replacements = {x.split(', ')[0]: int(x.split(', ')[1]) for x in requests.get(POINT_REPLACEMENTS_URL).content.decode().split('\n')}

datasets_without_blacklisted_items = {}

for activity, collection in datasets.items():
	datasets_without_blacklisted_items[activity] = {}
	addresses = set(collection.keys())
	filtered_addresses = addresses - blacklisted_addresses

	for address in filtered_addresses:
		if address not in datasets_without_blacklisted_items[activity]:
			datasets_without_blacklisted_items[activity][address] = 1
		else:
			datasets_without_blacklisted_items[activity][address] += 1

point_totals_per_address = {}
for activity, collection in datasets_without_blacklisted_items.items():
	for address in collection:
		if address not in point_totals_per_address:
			point_totals_per_address[address] = 0

		point_totals_per_address[address] += 1

total_points = sum(point_totals_per_address.values())

# 150,000 kDAO earmarked for the airdrop
TOKEN_ALLOCATION = 150_000

split_per_point = TOKEN_ALLOCATION / total_points

print('New point allocation per address {}'.format(split_per_point))

csv_data = 'address, token_allocation\n'
for address, points in point_totals_per_address.items():
	csv_data += "{}, {}".format(address, points * split_per_point) + "\n"

with open('/tmp/airdrop-data.csv', 'w') as f:
	f.write(csv_data)

print("Wrote airdrop data to /tmp/airdrop-data.csv")