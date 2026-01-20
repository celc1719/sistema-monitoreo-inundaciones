from pymongo import MongoClient

def get_database():
    uri = "mongodb+srv://yarvis:Rodrigo1234@ro.84evfrp.mongodb.net/?retryWrites=true&w=majority&appName=ro"
    client = MongoClient(uri)
    return client["MiDG"]
