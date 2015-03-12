package com.example.burgess_employeeapp;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import android.annotation.SuppressLint;
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

public class BluetoothCollection {
	private HashMap<String, String> mStationMacs;
	private String mLocalMacAddress;
	
	private BluetoothManager mBluetoothManager;
	private BluetoothAdapter mBluetoothAdapter;
	private BluetoothMetadataThread mbtThread;
	private MainActivity mMainActivity;
	
	private Object mSyncToken;
	
	private boolean mErrors = false;
	
	@SuppressLint("NewApi") public BluetoothCollection(HashMap<String, String> stationMacs, BluetoothManager bluetoothManager, WifiManager wifiManager, ConnectivityManager connMgr, MainActivity self, BluetoothMetadataThread btThread, Object syncToken)
	{
		mStationMacs = stationMacs;
		mBluetoothManager = bluetoothManager;
		mBluetoothAdapter = mBluetoothManager.getAdapter();
		mbtThread = btThread;
		mMainActivity = self;
		mSyncToken = syncToken;
		
		//wifi needs to be enabled to get the MAC.
		boolean previousState = wifiManager.isWifiEnabled();
		wifiManager.setWifiEnabled(true);
		mLocalMacAddress = wifiManager.getConnectionInfo().getMacAddress();
		wifiManager.setWifiEnabled(previousState);
		
		if (!isConnected(connMgr))
		{
			mErrors = true;
			return;
		}
	}
	
	public void startCollection(ArrayList<Result> results)
	{
			IntentFilter filter = new IntentFilter();
			filter.addAction(BluetoothDevice.ACTION_FOUND);
			filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
			mMainActivity.registerReceiver(mReceiver, filter);
			
			mBluetoothAdapter.startDiscovery();
	}
	
	public boolean hasErrors()
	{
		return mErrors;
	}
	
	private boolean isConnected(ConnectivityManager connMgr){
            NetworkInfo networkInfo = connMgr.getActiveNetworkInfo();
            if (networkInfo != null && networkInfo.isConnected())
                return true;
            else
                return false;    
    }
	
	private final BroadcastReceiver mReceiver = new BroadcastReceiver() {
		public void onReceive(Context context, Intent intent) {
			String action = intent.getAction();
			if (BluetoothDevice.ACTION_FOUND.equals(action)) {
				BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
				int  rssi = intent.getShortExtra(BluetoothDevice.EXTRA_RSSI,Short.MIN_VALUE);
				Calendar time = Calendar.getInstance();
				
				if (mStationMacs.containsKey(device.getAddress()))
					mbtThread.addResult(new Result(mLocalMacAddress, mStationMacs.get(device.getAddress()), rssi, time.getTime()));
			}
			else if (BluetoothAdapter.ACTION_DISCOVERY_FINISHED.equals(action))
			{
				mMainActivity.unregisterReceiver(mReceiver);
				synchronized(mSyncToken)
				{
					mSyncToken.notify();
				}
			}
		}
	};
}
