class Utils

    def self.StandardizeTime_s(t)
        t = t.to_i if t.is_a? Time
        t /= 1000 if Utils.CountDigits(t) == 13
        return t
    end

    def self.CountDigits(number)
        ((number == 0) ? 1 : Math.log10(number)+1).to_i
    end
end
