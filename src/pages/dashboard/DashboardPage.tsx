import { Container } from '@/components/container';
import { Card } from '@/components/ui/card';
import { KeenIcon } from '@/components';

const DashboardPage = () => {
  return (
    <Container>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 rounded-lg p-3">
              <KeenIcon icon="notification-bing" className="text-primary size-6" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Active Alerts</div>
              <div className="text-2xl font-semibold text-gray-900">24</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-warning/10 rounded-lg p-3">
              <KeenIcon icon="shield-cross" className="text-warning size-6" />
            </div>
            <div>
              <div className="text-sm text-gray-600">High Risk Cases</div>
              <div className="text-2xl font-semibold text-gray-900">8</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-success/10 rounded-lg p-3">
              <KeenIcon icon="document-check" className="text-success size-6" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Completed Reviews</div>
              <div className="text-2xl font-semibold text-gray-900">156</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-info/10 rounded-lg p-3">
              <KeenIcon icon="chart-line" className="text-info size-6" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Transactions Monitored</div>
              <div className="text-2xl font-semibold text-gray-900">1,284</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Alerts</h3>
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-danger/10 rounded-full p-2">
                    <KeenIcon icon="notification-bing" className="text-danger size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Suspicious Transaction Pattern
                    </div>
                    <div className="text-xs text-gray-600">Customer ID: #12345{i}</div>
                  </div>
                </div>
                <button className="btn btn-sm btn-light">Review</button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Risk Distribution</h3>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-danger"></div>
              <span className="text-sm text-gray-600">High Risk (15%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning"></div>
              <span className="text-sm text-gray-600">Medium Risk (35%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-sm text-gray-600">Low Risk (50%)</span>
            </div>
          </div>
          <div className="flex h-4 rounded-full overflow-hidden">
            <div className="bg-danger w-[15%]"></div>
            <div className="bg-warning w-[35%]"></div>
            <div className="bg-success w-[50%]"></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <button className="btn btn-sm btn-light">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 text-sm text-gray-900">TRX-{2024000 + i}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">Customer #{10000 + i}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${(Math.random() * 10000).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          i % 3 === 0
                            ? 'bg-danger/10 text-danger'
                            : i % 3 === 1
                              ? 'bg-warning/10 text-warning'
                              : 'bg-success/10 text-success'
                        }`}
                      >
                        {i % 3 === 0 ? 'High' : i % 3 === 1 ? 'Medium' : 'Low'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          i % 2 === 0 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {i % 2 === 0 ? 'Cleared' : 'Under Review'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Container>
  );
};

export { DashboardPage };
