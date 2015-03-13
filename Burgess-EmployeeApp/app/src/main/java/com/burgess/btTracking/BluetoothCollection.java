package com.burgess.btTracking;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.wifi.WifiManager;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;

public class BluetoothCollection
{
	private HashMap<String, String> m_stationMacs;
	private String m_localMacAddress;

	private BluetoothManager m_bluetoothManager;
	private BluetoothAdapter m_bluetoothAdapter;
	private BluetoothMetadataThread m_btThread;
	private BroadcastReceiver m_receiver;
	private Context m_context;

	private final Object m_syncToken;

	private boolean m_errors = false;

	public BluetoothCollection(HashMap<String, String> stationMacs,
	                           BluetoothManager bluetoothManager,
	                           WifiManager wifiManager,
	                           ConnectivityManager connMgr,
	                           Context context,
	                           BluetoothMetadataThread btThread,
	                           Object syncToken)
	{
		m_stationMacs = stationMacs;
		m_bluetoothManager = bluetoothManager;
		m_bluetoothAdapter = m_bluetoothManager.getAdapter();
		m_btThread = btThread;
		m_context = context;
		m_syncToken = syncToken;

		//wifi needs to be enabled to get the MAC.
		boolean previousState = wifiManager.isWifiEnabled();
		wifiManager.setWifiEnabled(true);
		m_localMacAddress = wifiManager.getConnectionInfo().getMacAddress();
		wifiManager.setWifiEnabled(previousState);

		m_receiver = new BluetoothReceiver();

		if (!isConnected(connMgr))
		{
			m_errors = true;
		}
	}

	// TODO::JT figure out what is going on here and clean up
	public void startCollection(ArrayList<Result> results)
	{
		IntentFilter filter = new IntentFilter();
		filter.addAction(BluetoothDevice.ACTION_FOUND);
		filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
		m_context.registerReceiver(m_receiver, filter);

		m_bluetoothAdapter.startDiscovery();
	}

	public boolean hasErrors()
	{
		return m_errors;
	}

	private boolean isConnected(ConnectivityManager connMgr)
	{
		NetworkInfo networkInfo = connMgr.getActiveNetworkInfo();
		return networkInfo != null && networkInfo.isConnected();
	}

	private class BluetoothReceiver extends BroadcastReceiver
	{
		public void onReceive(Context context, Intent intent)
		{
			String action = intent.getAction();
			if (BluetoothDevice.ACTION_FOUND.equals(action))
			{
				BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
				int rssi = intent.getShortExtra(BluetoothDevice.EXTRA_RSSI, Short.MIN_VALUE);
				Calendar time = Calendar.getInstance();

				if (m_stationMacs.containsKey(device.getAddress()))
				{
					m_btThread.addResult(new Result(m_localMacAddress, m_stationMacs.get(device.getAddress()), rssi, time.getTime()));
				}
			}
			else if (BluetoothAdapter.ACTION_DISCOVERY_FINISHED.equals(action))
			{
				m_context.unregisterReceiver(m_receiver);
				synchronized (m_syncToken)
				{
					m_syncToken.notify();
				}
			}
		}
	}
}
