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
import android.os.AsyncTask;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;

public final class BluetoothCollection
{
	// Singletons are awful... but because Android this is the simplest way to do this
	public static BluetoothCollection Instance;

	private HashMap<String, String> m_stationMacs;
	private String m_localMacAddress;

	private BluetoothManager m_bluetoothManager;
	private BluetoothAdapter m_bluetoothAdapter;
	private BroadcastReceiver m_receiver;

	private ArrayList<BluetoothListener> m_listeners = new ArrayList<>();

	private boolean m_errors = false;

	public BluetoothCollection(HashMap<String, String> stationMacs,
	                           BluetoothManager bluetoothManager,
	                           WifiManager wifiManager,
	                           ConnectivityManager connMgr)
	{
		m_stationMacs = stationMacs;
		m_bluetoothManager = bluetoothManager;
		m_bluetoothAdapter = m_bluetoothManager.getAdapter();

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

		Instance = this;
	}

	public void startCollection(Context context)
	{
		IntentFilter filter = new IntentFilter();
		filter.addAction(BluetoothDevice.ACTION_FOUND);
		filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
		context.registerReceiver(m_receiver, filter);

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

	public void ListenForData(BluetoothListener listener)
	{
		m_listeners.add(listener);
	}

	public void RemoveListener(BluetoothListener listener)
	{
		m_listeners.remove(listener);
	}

	private void PublishData(ArrayList<Result> data)
	{
		for (BluetoothListener listener : m_listeners)
		{
			listener.OnDataReady(data);
		}
	}

	public interface BluetoothListener
	{
		void OnDataReady(ArrayList<Result> results);
	}

	private class BluetoothReceiver extends BroadcastReceiver
	{
		private ArrayList<Result> m_results = new ArrayList<>();

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
					m_results.add(new Result(m_localMacAddress,
							m_stationMacs.get(device.getAddress()),
							rssi,
							time.getTime()));
				}
			}
			else if (BluetoothAdapter.ACTION_DISCOVERY_FINISHED.equals(action))
			{
				context.unregisterReceiver(m_receiver);
				PublishData(m_results);
				BluetoothSendMetaData sender = new BluetoothSendMetaData();
				sender.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR, m_results);
				m_results = new ArrayList<>();
			}
		}
	}
}
