package com.example.burgess_employeeapp;

import java.util.Calendar;

import android.support.v7.app.ActionBarActivity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;


public class MainActivity extends ActionBarActivity {

	private final static int REQUEST_ENABLE_BT = 55;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);
		
		IntentFilter filter = new IntentFilter();
		filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_STARTED);
		filter.addAction(BluetoothDevice.ACTION_FOUND);
		filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
		this.registerReceiver(mReceiver, filter);
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.main, menu);
		return true;
	}
	
	@Override
	  protected void onDestroy() {
	    super.onDestroy();
	    if (mBluetoothAdapter != null) {
	    	mBluetoothAdapter.cancelDiscovery();
	    }
	    unregisterReceiver(mReceiver);
	  }

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Handle action bar item clicks here. The action bar will
		// automatically handle clicks on the Home/Up button, so long
		// as you specify a parent activity in AndroidManifest.xml.
		int id = item.getItemId();
		if (id == R.id.action_settings) {
			return true;
		}
		return super.onOptionsItemSelected(item);
	}

	private BluetoothAdapter mBluetoothAdapter;

	public void findBluetooth(View view) {
		final BluetoothManager bluetoothManager = (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE);
		mBluetoothAdapter = bluetoothManager.getAdapter();

		if (!mBluetoothAdapter.isEnabled()) {
			Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
			startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT);
		}
		
		if (!scanRunning)
		{
			TextView textView = (TextView) findViewById(R.id.text);
			textView.setText(mBluetoothAdapter.getAddress());
			mBluetoothAdapter.startDiscovery();
		}
		else
			Toast.makeText(getApplicationContext(), "Scan Running.", Toast.LENGTH_SHORT).show();
	}
	
	boolean scanRunning = false;

	private final BroadcastReceiver mReceiver = new BroadcastReceiver() {
		public void onReceive(Context context, Intent intent) {
			String action = intent.getAction();
			if (BluetoothDevice.ACTION_FOUND.equals(action)) {
				BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
				int  rssi = intent.getShortExtra(BluetoothDevice.EXTRA_RSSI,Short.MIN_VALUE);
				
				Calendar time = Calendar.getInstance();
				
				TextView textView = (TextView) findViewById(R.id.text);
				textView.setText(textView.getText() + "\nName: " + device.getAddress() + " Strength: " + rssi + " Time: " + time.getTime().toString());
			}
			else if (BluetoothAdapter.ACTION_DISCOVERY_STARTED.equals(action))
			{
				Toast.makeText(getApplicationContext(), "Started.", Toast.LENGTH_SHORT).show();
				scanRunning = true;
			}
			else if (BluetoothAdapter.ACTION_DISCOVERY_FINISHED.equals(action))
			{
				Toast.makeText(getApplicationContext(), "finished.", Toast.LENGTH_SHORT).show();
				scanRunning = false;
			}
		}
	};
}
