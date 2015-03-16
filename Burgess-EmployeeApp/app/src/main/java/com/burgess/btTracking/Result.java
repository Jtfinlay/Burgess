package com.burgess.btTracking;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Date;

public final class Result implements Comparable<Result>
{
	private String mac;
	private String source;
	private int signalStrength;
	private Date time;

	public Result(String mac, String source, int signalStrength, Date time)
	{
		this.mac = mac;
		this.source = source;
		this.signalStrength = signalStrength;
		this.time = time;
	}

	public JSONObject getJSON()
	{
		JSONObject result = new JSONObject();

		try
		{
			result.put("mac", mac);
			result.put("source", source);
			result.put("strength", signalStrength);
			result.put("time", time.toString());
		}
		catch (JSONException e)
		{
			e.printStackTrace();
		}

		return result;
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

	public Date getTime()
	{
		return this.time;
	}

	@Override
	public int compareTo(Result another)
	{
		return mac.compareTo(another.getMAC());
	}
}
