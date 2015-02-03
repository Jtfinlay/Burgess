require 'rubygems'
require 'bundler/setup'

require 'sinatra'

get '/' do
    erb :layout
end

get '/hello/:name' do |n|
    "Hello #{n}!"
end
