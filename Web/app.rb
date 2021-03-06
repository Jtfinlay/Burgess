require 'rubygems'
require 'bundler/setup'
require 'bcrypt'

require './src/utils'
require './src/js'
require './src/db_user'
require './src/db_position'
require './src/db_archive'
require './src/db_analytics'

class BurgessApp < Sinatra::Base
	helpers Sinatra::JavaScripts

    def route
        request.path
    end

    configure do
        enable :sessions
        set :db_user, UserData.new
        set :db_position, PositionData.new
		set :db_archived, ArchiveData.new
		set :db_analytics, AnalyticsData.new
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

    template :empty_layout do
    end

    get '/' do
        erb :home
    end

    get '/livefeed' do
        session[:path] = request.path
        if authenticated?
    		js :jcanvas, :knockout, 'map', 'knockout/livefeed'
            erb :livefeed
        else
            erb :login_form
        end
    end

	get '/livefeed/data' do
        if authenticated?
    		session[:timelast] = Time.now - 30 if session[:timelast].nil? || Time.now - 30 > session[:timelast]
    		result = settings.db_archived.getPositionsSince(session[:timelast])
    		session[:timelast] = Time.now
    		return result.to_json
        end
        return nil
	end

    get '/playback' do
        session[:path] = request.path
        if authenticated?
    		js :datetime, :knockout, :jcanvas, :nvd3, 'map', 'timeselect', 'knockout/playback'
            erb :playback
        else
            erb :login_form
        end
    end

    get '/analytics' do
        session[:path] = request.path
        if authenticated?
    		js :nvd3, :knockout, :datetime, 'analytics/helpedTimeChart', 
                'analytics/peakChart', 'analytics/helpedCountChart', 'knockout/analytics'
            erb :analytics
        else
            erb :login_form
        end
    end

    get '/settings' do
        session[:path] = request.path
        if authenticated?
    		js :knockout, 'knockout/settings'
            erb :settings
        else
            erb :login_form
        end
    end

	### ANALYTICS ###

	post '/analytics/helpCount' do
		ti = Utils.StandardizeTime_s(params[:ti].to_i)
		tf = Utils.StandardizeTime_s(params[:tf].to_i)
		if authenticated?
			employees = settings.db_user.getEmployees(session[:identity].id)
			employees.map!{|e| e["_id"]}
            return settings.db_analytics.getEmployeeHelpCount(ti,tf,0,employees).to_json
		end
		return nil
	end

	post '/analytics/helpTime' do
		ti = Utils.StandardizeTime_s(params[:ti].to_i)
		tf = Utils.StandardizeTime_s(params[:tf].to_i)
		if authenticated?
			employees = settings.db_user.getEmployees(session[:identity].id)
            employees.map!{|e| e["_id"]}
			return settings.db_analytics.getEmployeeHelpTime(ti,tf,employees).to_json
		end
		return nil
	end

    post '/analytics/customersHourly' do
        ti = Utils.StandardizeTime_s(params[:ti].to_i)
        tf = Utils.StandardizeTime_s(params[:tf].to_i)
        if authenticated?
            return settings.db_archived.getVisitorsHourly(ti, tf, false).to_json
        end
        return nil
    end

    post '/analytics/employeesHourly' do
        ti = Utils.StandardizeTime_s(params[:ti].to_i)
        tf = Utils.StandardizeTime_s(params[:tf].to_i)
        if authenticated?
            return settings.db_archived.getVisitorsHourly(ti, tf, true).to_json
        end
        return nil
    end

	### EMPLOYEES ###

	get '/employees' do
		if authenticated?
			return settings.db_user.getEmployees(session[:identity].id).to_json
		end
		return nil
	end

	post '/employees' do
		if authenticated?
			settings.db_user.updateEmployees(session[:identity].id,Employee.fromArray(JSON.parse(params[:update])))
			settings.db_user.removeEmployees(session[:identity].id,Employee.fromArray(JSON.parse(params[:remove])))
		end
	end

	### MAP ###

    get '/map/size' do
        if authenticated?
            return session[:identity].getMapDetails.to_json
        end
		return nil
    end

    ### MOBILE ####

    get '/livefeed_mobile' do
        js :jcanvas, :knockout, 'map', 'knockout/livefeed_mobile'
        erb :livefeed_mobile, :layout => false
    end

    get '/livefeed_mobile/data' do
        session[:timelast] = Time.now - 4 if session[:timelast].nil? || session[:timelast] > Time.now - 8
        result = settings.db_archived.getPositionsSince(session[:timelast])
        session[:timelast] = Time.now
        return result.to_json
    end

    post '/auth_mobile' do
        session[:identity] = settings.db_user.getEmployeeByAuth(params['auth_code'])
        return session[:identity].nil?.to_json
    end

    ### PLAY BACK ###

    post '/playback/date' do
        if authenticated?
            t = Utils.StandardizeTime_s(params[:t].to_i)
            timezone = params[:timezone].to_i
    		return settings.db_archived.getPositionsOverDay(t, timezone).to_json
        end
        return nil
    end

    ### AUTHENTICATION ###

    get '/login' do
        erb :login
    end

    post '/login' do
        session[:identity] = settings.db_user.getUser(params['username'])
        if not session[:identity].nil? and session[:identity].validatePassword(params['password'])
            redirect to session[:path] || '/'
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
        user = User.new.createUser(params['username'], params['password'], params['company'], params['storeID'])

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
