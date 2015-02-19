require 'rubygems'
require 'bundler/setup'
require 'sinatra'
require 'bcrypt'

require './userDB'

class BurgessApp < Sinatra::Base

    def route
        request.path
    end

    configure do
        enable :sessions
        set :db, UserData.new
    end

    helpers do
        def authenticated?
            not session[:identity].nil?
        end

        def pop_errors
            tmp = session[:errors] || []
            session[:errors] = []
            return tmp
        end

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

    post '/timelapse/date' do
        # TODO - Validate input

        v = params[:value].split('-')
        return settings.db.getCustomersForDay(v[2].to_i, v[0].to_i, v[1].to_i)
    end

    post '/timelapse/positions' do
        # TODO - Validate input

        t = params[:time].to_i / 1000
        puts t
        puts Time.at(t)
        return settings.db.getLatestPositionsWithinInterval(Time.at(t-20), Time.at(t)).to_json

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

    post '/login' do
        session[:identity] = settings.db.getUser(params['username'])
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
    
        push_error("Username taken") if not settings.db.getUser(params['username']).nil?
        push_error("Passwords must match") if not user.validatePassword(params['re-password'])

        if not session[:errors] or session[:errors].empty?
            session[:identity] = user
            settings.db.storeUser(user)
            redirect to '/'
        else
            redirect to '/signup'
        end
    end
end
