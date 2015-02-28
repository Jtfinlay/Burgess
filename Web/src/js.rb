require 'sinatra/base'

# From https://github.com/daz4126/sinatra-head-cleaner/blob/master/sinatra/head_cleaner.rb
module Sinatra
	module JavaScripts

		def js(*args)
			@js ||= []
			@js = args
		end

		def javascripts(*args)
			js = []
			js << settings.javascripts if settings.respond_to?('javascripts')
			js << args
			js << @js if @js
			js.flatten.uniq.map do |script|
				path_to(script).map do |script|
					"<script src=\"#{script}\"></script>"
				end
			end.join
		end

		def path_to script
			case script
			when :datetime then ["/vendor/datetimepicker/jquery.datetimepicker.js"]
			when :jcanvas then ["/vendor/canvascript/jCanvaScript.1.5.18.min.js"]
			when :nvd3 then ["http://d3js.org/d3.v3.min.js", "/vendor/NVD3/nv.d3.min.js"]
			else ["/js/" + script.to_s + ".js"]
			end
		end
	end

	helpers JavaScripts
end

