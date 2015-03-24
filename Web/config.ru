#\ -o 0.0.0.0 -p 80
Dir.chdir(File.dirname(File.expand_path(__FILE__)))
require './app'

run BurgessApp
