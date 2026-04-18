import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-blue to-secondary-green flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-semibold text-white mb-4">
            Balai Assist
          </h1>
          <p className="text-xl text-white/90">
            Guest Portal & Service Management System
          </p>
          <p className="text-lg text-white/80 mt-2">
            Club Balai Isabel
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Guest Portal */}
          <Link
            to="/guest"
            className="card hover:shadow-xl transition-shadow duration-200 text-center p-8"
          >
            <div className="text-5xl mb-4">🏨</div>
            <h2 className="text-2xl font-semibold mb-2 text-primary-blue">
              Guest Portal
            </h2>
            <p className="text-gray-600 mb-4">
              Submit service requests and track status
            </p>
            <div className="text-sm text-gray-500">
              <p>Demo: Room 101</p>
              <p>PIN: 1234</p>
            </div>
          </Link>
          
          {/* Staff Dashboard */}
          <Link
            to="/staff"
            className="card hover:shadow-xl transition-shadow duration-200 text-center p-8"
          >
            <div className="text-5xl mb-4">👥</div>
            <h2 className="text-2xl font-semibold mb-2 text-primary-blue">
              Staff Dashboard
            </h2>
            <p className="text-gray-600 mb-4">
              Manage tickets and resolve requests
            </p>
            <div className="text-sm text-gray-500">
              <p>Demo: it_staff</p>
              <p>Pass: password123</p>
            </div>
          </Link>
          
          {/* Executive Dashboard */}
          <Link
            to="/executive"
            className="card hover:shadow-xl transition-shadow duration-200 text-center p-8"
          >
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold mb-2 text-primary-blue">
              Executive Dashboard
            </h2>
            <p className="text-gray-600 mb-4">
              View analytics and performance metrics
            </p>
            <div className="text-sm text-gray-500">
              <p>Demo: executive</p>
              <p>Pass: admin123</p>
            </div>
          </Link>
        </div>
        
        <div className="mt-12 text-center text-white/80">
          <p className="text-sm">
            Functional Prototype - Balai Assist v1.0
          </p>
          <p className="text-xs mt-2">
            All demo credentials are listed on each portal card
          </p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
