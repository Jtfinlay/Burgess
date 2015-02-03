require 'rubygems'
require 'bundler/setup'

require 'sinatra'

def route
    request.path
end

get '/' do
    erb :main do
         erb :home
    end
end

get '/hello/:name' do |n|
    "Hello #{n}!"
end
