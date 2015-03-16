package com.burgess.employeeApp;

import android.content.Context;
import android.support.v7.app.ActionBarActivity;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import com.burgess.btTracking.BluetoothMetadataThread;
import com.burgess.btTracking.Result;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ViewBTActivity extends ActionBarActivity implements BluetoothMetadataThread.OnDataRxedCallback
{
	private BluetoothListAdapter m_adapter;
	private ListView m_list;

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_view_bt);

		m_adapter = new BluetoothListAdapter(getApplicationContext());
		m_list = (ListView) this.findViewById(R.id.bluetoothListView);
		m_list.setAdapter(m_adapter);

		// I really hate singletons....
		if(BluetoothMetadataThread.Instance != null)
		{
			BluetoothMetadataThread.Instance.RegisterListener(this);
		}
		else
		{
			Toast.makeText(getApplicationContext(), "Failed to get BT data!", Toast.LENGTH_LONG).show();
		}
	}

	@Override
	protected void onDestroy()
	{
		if(BluetoothMetadataThread.Instance != null)
		{
			BluetoothMetadataThread.Instance.RemoveListener(this);
		}

		super.onDestroy();
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu)
	{
		return false;
	}

	@Override
	public void OnDataAvailable(final ArrayList<Result> data)
	{
		if(data.size() == 0)
		{
			return;
		}

		runOnUiThread(new Runnable()
		{
			@Override
			public void run()
			{
				m_adapter.SetData(data);
				m_list.invalidate();
			}
		});
	}

	private final class BluetoothListAdapter extends BaseAdapter
	{
		private Object m_syncToken = new Object();
		private Map<String, Result> m_data = new HashMap<>();
		private List<String> m_macs = new ArrayList<>();
		private Context m_context;

		public BluetoothListAdapter(Context context)
		{
			m_context = context;
		}

		@Override
		public int getCount()
		{
			synchronized (m_syncToken)
			{
				return m_data.size();
			}
		}

		@Override
		public Result getItem(int position)
		{
			synchronized (m_syncToken)
			{
				return m_data.get(m_macs.get(position));
			}
		}

		@Override
		public long getItemId(int position)
		{
			return position;
		}

		@Override
		public View getView(int position, View convertView, ViewGroup parent)
		{
			LayoutInflater inflater = (LayoutInflater) m_context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
			View v = inflater.inflate(R.layout.bluetooth_item, null);
			TextView mac = (TextView) v.findViewById(R.id.macAddress);
			TextView strength = (TextView) v.findViewById(R.id.strength);

			synchronized (m_syncToken)
			{
				Result res = getItem(position);
				mac.setText(res.getMAC());
				strength.setText(((Integer)(res.getSignalStrength())).toString());
			}

			return v;
		}

		public void SetData(List<Result> data)
		{
			synchronized (m_syncToken)
			{
				for(Result res : data)
				{
					if(!m_data.containsKey(res.getMAC()))
					{
						m_macs.add(0, res.getMAC());
					}
					m_data.put(res.getMAC(), res);
				}

				notifyDataSetChanged();
			}
		}
	}
}
