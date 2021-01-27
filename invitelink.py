import json
with open("secrets.json") as s:
    config = json.load(s)
    clId = config["discord-client-id"]
    perms = config["discord-permissions-integer"]
    print(f"https://discord.com/oauth2/authorize?client_id={clId}&scope=bot&permissions={perms}")