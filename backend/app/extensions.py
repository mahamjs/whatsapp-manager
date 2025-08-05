#GLOBAL TOOLS THAT THE APP CAN USE 

from flask_sqlalchemy import SQLAlchemy #to create a global SQLalchemy object which is bound to Flsk App later--> Talks to the data base --> it is a library that connects python code to database
from flask_limiter import Limiter #blocks people from sending too many requests --> limit how many times API can be used i.e. stop from sending 1000 messsages in one minute 
from flask_limiter.util import get_remote_address
from passlib.hash import bcrypt #to store JWT's bycrypt hash in db


#creating tools but not running them yet 
db = SQLAlchemy() #instanitiation of the db 
limiter = Limiter(key_func=get_remote_address) #block overuse 
hash_engine = bcrypt #secure API keys safely 
