require 'rubygems'
require 'bundler/setup'

require 'sinatra'

def route
    request.path
end

get '/' do
   # erb :site_layout, :layout => false do
        erb :main do
             erb :navbar
        end
   # end
end

get '/hello/:name' do |n|
    "Hello #{n}!"
end
