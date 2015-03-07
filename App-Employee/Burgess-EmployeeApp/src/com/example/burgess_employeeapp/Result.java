package com.example.burgess_employeeapp;

import java.util.Calendar;

public class Result {
	private String mac;
	private String source;
	private int signalStrength;
	private Calendar time;
	
	public Result(String mac, String source, int signalStrength, Calendar time)
	{
		this.mac = mac;
		this.source = source;
		this.signalStrength = signalStrength;
		this.time = time;
	}
	
	public String getMAC()
	{
		return this.mac;
	}
	
	public String getSource()
	{
		return this.source;
	}
	
	public int getSignalStrength()
	{
		return this.signalStrength;
	}
	
	public Calendar getTime()
	{
		return this.time;
	}
}
