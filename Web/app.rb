require 'rubygems'
require 'bundler/setup'
require 'bcrypt'

require './src/js'
require './src/db_user'
require './src/db_position'
require './src/db_archive'

class BurgessApp < Sinatra::Base
	helpers Sinatra::JavaScripts

    configure do
        enable :sessions
        set :db_user, UserData.new
        set :db_position, PositionData.new
		set :db_archived, ArchiveData.new
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
        erb :home
    end

    get '/about' do
        erb :about
    end

    get '/livefeed' do
		js :datetime, :jcanvas, :nvd3, 'map', 'timeselect', 'positionblock', 'timelapse'
		puts session[:identity]
        erb :livefeed
    end

    get '/timelapse' do
		js :datetime, :jcanvas, :nvd3, 'map', 'timeselect', 'positionblock', 'timelapse'
        erb :timelapse
    end

    get '/analytics' do
		js :knockout, :nvd3, 'analytics'
        erb :analytics
    end

    get '/settings' do
		js :knockout, 'knockout/settings'
        erb :settings
    end

	### MAP ###

    get '/map/size' do
        if authenticated?
            return session[:identity].getMapDetails.to_json
        end
		return nil
    end

    ### TIME LAPSE ###

    post '/timelapse/date' do
        v = params[:value].split('-')
		return settings.db_archived.getPositionsOverDay(v[2].to_i, v[0].to_i, v[1].to_i, v[3].to_i).to_json
    end

    ### AUTHENTICATION ###

    get '/login' do
        erb :login
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
        erb :signup
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
