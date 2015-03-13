package com.burgess.btTracking;

import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.wifi.WifiManager;
import android.os.PowerManager;

import java.util.ArrayList;
import java.util.HashMap;

public class BluetoothMetadataThread extends Thread
{
	private ArrayList<Result> m_results;
	private BluetoothCollection m_bluetoothCollector;
	private BluetoothSendMetaData m_bluetoothSender;

	private final Object m_syncToken = new Object();
	private PowerManager.WakeLock m_wakeLock;

	public BluetoothMetadataThread(BluetoothManager bluetoothManager,
	                               WifiManager wifiManager,
	                               ConnectivityManager connMgr,
	                               Context context)
	{
		m_bluetoothCollector = new BluetoothCollection(getStationMacs(), bluetoothManager, wifiManager, connMgr, context, this, m_syncToken);
		m_bluetoothSender = new BluetoothSendMetaData();

		//runs cpu in background to transmit location data while phone is asleep
		PowerManager pm = (PowerManager) context.getApplicationContext().getSystemService(Context.POWER_SERVICE);
		m_wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "WakeLock");
	}

	public void run()
	{
		while (true)
		{
			m_wakeLock.acquire();

			synchronized (m_syncToken)
			{
				try
				{
					m_results = new ArrayList<Result>();
					m_bluetoothCollector.startCollection(m_results);
					m_syncToken.wait();
					m_bluetoothSender.POST(m_results);

				}
				catch (InterruptedException e)
				{
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
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
}
