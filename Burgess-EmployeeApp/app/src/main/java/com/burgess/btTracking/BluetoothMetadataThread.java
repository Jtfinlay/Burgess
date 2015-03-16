package com.burgess.btTracking;

import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.wifi.WifiManager;
import android.os.PowerManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Random;

public class BluetoothMetadataThread extends Thread
{
	// I really hate this... but its the least boiler plate solution...
	public static BluetoothMetadataThread Instance = null;

	private ArrayList<Result> m_results;
	private List<OnDataRxedCallback> m_listeners;
	private BluetoothCollection m_bluetoothCollector;
	private BluetoothSendMetaData m_bluetoothSender;
	private boolean m_isRunning = false;

	private final Object m_syncToken = new Object();
	private PowerManager.WakeLock m_wakeLock;

	public BluetoothMetadataThread(BluetoothManager bluetoothManager,
	                               WifiManager wifiManager,
	                               ConnectivityManager connMgr,
	                               Context context)
	{
		m_listeners = new ArrayList<OnDataRxedCallback>();
		m_bluetoothCollector = new BluetoothCollection(getStationMacs(), bluetoothManager, wifiManager, connMgr, context, this, m_syncToken);
		m_bluetoothSender = new BluetoothSendMetaData();

		//runs cpu in background to transmit location data while phone is asleep
		PowerManager pm = (PowerManager) context.getApplicationContext().getSystemService(Context.POWER_SERVICE);
		m_wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "WakeLock");
	}

	public void RegisterListener(OnDataRxedCallback listener)
	{
		synchronized (m_syncToken)
		{
			m_listeners.add(listener);
		}
	}

	public void RemoveListener(OnDataRxedCallback listener)
	{
		synchronized (m_syncToken)
		{
			m_listeners.remove(listener);
		}
	}

	private void PublishData(ArrayList<Result> results)
	{
		for (OnDataRxedCallback cb : m_listeners)
		{
			cb.OnDataAvailable(results);
		}
	}

	public boolean GetIsRunning()
	{
		return m_isRunning;
	}

	public void StopCollection()
	{
		m_isRunning = false;
	}

	public void run()
	{
		Instance = this;
		m_isRunning = true;

		while (m_isRunning)
		{
			try
			{
				// TODO::JT remove this once I have a bette idea what Tylers intent was with the
				// multiple threads and locks...
				sleep(100);
			}
			catch (InterruptedException e)
			{
				e.printStackTrace();
			}

			m_wakeLock.acquire();

			synchronized (m_syncToken)
			{
				try
				{
					m_results = new ArrayList<Result>();
					m_bluetoothCollector.startCollection(m_results);
					m_syncToken.wait();
				}
				catch (InterruptedException e)
				{
					// TODO Auto-generated catch block
					e.printStackTrace();
				}

				// TODO::JT introducing a race condition until I can resolve some concerns
				// with Tyler. This probably won't cause problems, but it can.
				PublishData(m_results);
				m_bluetoothSender.POST(m_results);
			}
		}
		Instance = null;
	}

	public void addResult(Result newResult)
	{
		m_results.add(newResult);
	}

	//get from database when setup
	private HashMap<String, String> getStationMacs()
	{
		HashMap<String, String> stationMacs = new HashMap<String, String>();
		stationMacs.put("00:19:5B:0E:4C:71", "bt-stn1");
		stationMacs.put("00:19:5B:0E:4C:72", "bt-stn2");
		stationMacs.put("E4:98:D6:63:1D:86", "iPad");
		stationMacs.put("04:1E:64:C7:A2:15", "iPhone");
		return stationMacs;
	}

	public interface OnDataRxedCallback
	{
		void OnDataAvailable(ArrayList<Result> data);
	}
}
