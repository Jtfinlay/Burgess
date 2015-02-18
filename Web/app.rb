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

post '/timelapse/date' do
    # TODO - Validate input

    v = params[:value].split('-')
    return settings.mongo_db.getCustomersForDay(v[2].to_i, v[0].to_i, v[1].to_i)
end

post '/timelapse/positions' do
    # TODO - Validate input

    t = params[:time].to_i / 1000
    puts t
    puts Time.at(t)
    return settings.mongo_db.getLatestPositionsWithinInterval(Time.at(t-20), Time.at(t)).to_json

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

### AUTHENTICATION ###

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
