require 'rubygems'
require 'bundler/setup'

require './userDB'
require 'sinatra'

def route
    request.path
end

configure do
    enable :sessions
    set :mongo_db, UserData.new
end

helpers do
    def authenticated?
        not session[:identity].nil?
    end
end

get '/' do
    erb :main do
         erb :home
    end
end

get '/about' do
    erb :main do
        erb :about
    end
end

get '/livefeed' do
    erb :main do
        erb :livefeed
    end
end

get '/timelapse' do
    erb :main do
        erb :timelapse
    end
end

get '/analytics' do
    erb :main do
        erb :analytics
    end
end

get '/settings' do
    erb :main do
        erb :settings
    end
end

# AUTHENTICATION

get '/login' do
    erb :main do
        erb :login
    end
end

post '/login/attempt' do
    if settings.mongo_db.authenticate(params['username'], params['password'])
	redirect to '/login/invalid'
    else
	session[:identity] = params['username']
	redirect to '/'
    end
end

get '/login/*' do
     @error = "Invalid login" unless params[:splat].find("invalid").nil?
     erb :main do
         erb :login
     end
end

get '/logout' do
    session.delete(:identity)
    redirect to '/'
end
