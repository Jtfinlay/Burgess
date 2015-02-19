require 'rubygems'
require 'bundler/setup'
require 'sinatra'
require 'bcrypt'

require './db_user'
require './db_position'

class BurgessApp < Sinatra::Base

    def route
        request.path
    end

    configure do
        enable :sessions
        set :db_user, UserData.new
        set :db_position, PositionData.new
    end

    helpers do

        # Whether user is authenticated
        def authenticated?
            not session[:identity].nil?
        end

        # Get all errors and reset array
        def pop_errors
            tmp = session[:errors] || []
            session[:errors] = []
            return tmp
        end

        # Add error to array
        def push_error(error)
            (session[:errors] ||= []).push(error)
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


    ### TIME LAPSE ###

    post '/timelapse/date' do
        v = params[:value].split('-')
        puts v
        session[:positions] = settings.db_position.getPositionsOverDay(v[2].to_i, v[0].to_i, v[1].to_i, v[3].to_i)
        return session[:positions].queryCustomersHourly.to_json
    end

    post '/timelapse/positions' do
        t = Utils.StandardizeTime_s(params[:time].to_i)
        puts session[:positions].data.count
        return session[:positions].queryMostRecent(t-20, t).to_json
    end

    ### AUTHENTICATION ###

    get '/login' do
        erb :main do
            erb :login
        end
    end

    post '/login' do
        session[:identity] = settings.db_user.getUser(params['username'])
        if not session[:identity].nil? and session[:identity].validatePassword(params['password'])
            redirect to '/'
        else
            push_error('Invalid login')
            redirect to '/login'
        end
    end

    get '/logout' do
        session.delete(:identity)
        redirect to '/'
    end

    get '/signup' do
        erb :main do
            erb :signup
        end
    end

    post '/signup' do
        (user = User.new).createUser(params['username'], params['password'], params['company'], params['storeID'])
    
        push_error("Username taken") if not settings.db_user.getUser(params['username']).nil?
        push_error("Passwords must match") if not user.validatePassword(params['re-password'])

        if not session[:errors] or session[:errors].empty?
            session[:identity] = user
            settings.db_user.storeUser(user)
            redirect to '/'
        else
            redirect to '/signup'
        end
    end
end
