import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, TrendingDown, Droplets, Sun, Leaf, ArrowLeft, Info, ShoppingCart, Package, DollarSign, Users } from 'lucide-react';
import Navbar from './Navbar';
import { t } from './i18n';

export default function Insights() {
  const [siteLang, setSiteLang] = useState('en');
  const [userRole, setUserRole] = useState('farmer');
  const [loading, setLoading] = useState(true);
  const [contractStats, setContractStats] = useState({
    activeContracts: 0,
    pendingDeals: 0,
    rejectedContracts: 0,
    revenueThisMonth: 0,
    revenueChange: 0
  });
  const [weatherData, setWeatherData] = useState({
    temperature: null,
    humidity: null,
    rainfall: 'Loading...',
    rainfall_value: 0,
    recommendation: 'Loading weather data...',
    place_name: ''
  });
  const [marketPrices, setMarketPrices] = useState([]);
  const [marketPricesError, setMarketPricesError] = useState(false);
  const [allCrops, setAllCrops] = useState([]);
  const [allCropsError, setAllCropsError] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [monthlyPrices, setMonthlyPrices] = useState([]);
  const [monthlyPricesError, setMonthlyPricesError] = useState(false);
  
  // State Wise Insights
  const [stateWiseCrop, setStateWiseCrop] = useState('');
  const [stateWiseData, setStateWiseData] = useState([]);
  const [stateWiseError, setStateWiseError] = useState(false);

  // District Wise Insights
  const [districtWiseCrop, setDistrictWiseCrop] = useState('');
  const [districtWiseState, setDistrictWiseState] = useState('');
  const [districtWiseData, setDistrictWiseData] = useState([]);
  const [districtWiseError, setDistrictWiseError] = useState(false);

  // Buyer Deals
  const [buyerDeals, setBuyerDeals] = useState([]);
  const [buyerDealsLoading, setBuyerDealsLoading] = useState(false);

  // Buyer Contracts
  const [buyerContracts, setBuyerContracts] = useState([]);
  const [buyerContractsLoading, setBuyerContractsLoading] = useState(false);

  // Buyer Accepted Contracts
  const [buyerAcceptedContracts, setBuyerAcceptedContracts] = useState([]);
  const [buyerAcceptedContractsLoading, setBuyerAcceptedContractsLoading] = useState(false);

  // Buyer Rejected Contracts
  const [buyerRejectedContracts, setBuyerRejectedContracts] = useState([]);
  const [buyerRejectedContractsLoading, setBuyerRejectedContractsLoading] = useState(false);

  // Indian states list
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
  ];

  const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');

  useEffect(() => {
    const lang = localStorage.getItem('agri_lang') || 'en';
    const role = localStorage.getItem('agriai_role') || 'farmer';
    setSiteLang(lang);
    setUserRole(role);
  }, []);

  // Fetch weather data
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        // Try to get user's location from browser
        let lat = 30.9;
        let lon = 75.8;
        
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              lat = position.coords.latitude;
              lon = position.coords.longitude;
              fetchWeather(lat, lon);
            },
            (error) => {
              console.log('Geolocation error, using default:', error);
              fetchWeather(lat, lon);
            }
          );
        } else {
          fetchWeather(lat, lon);
        }
        
        async function fetchWeather(latitude, longitude) {
          const response = await fetch(`${apiBase}/weather?lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          if (data.ok) {
            console.log('Weather data received:', data);
            console.log('Place name from API:', data.place_name);
            setWeatherData({
              temperature: data.temperature,
              humidity: data.humidity,
              rainfall: data.rainfall,
              rainfall_value: data.current_rainfall || data.rainfall_value,
              recommendation: data.recommendation,
              place_name: data.place_name || ''
            });
          } else {
            console.log('Weather API error:', data.error);
          }
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setWeatherData({
          temperature: 32,
          humidity: 65,
          rainfall: 'Medium',
          rainfall_value: 0,
          recommendation: 'Weather data unavailable',
          place_name: ''
        });
      }
    };

    fetchWeatherData();
  }, [apiBase]);

  // Fetch market prices based on location
  useEffect(() => {
    const fetchMarketPrices = async () => {
      try {
        let lat = 30.9;
        let lon = 75.8;
        
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              lat = position.coords.latitude;
              lon = position.coords.longitude;
              fetchPrices(lat, lon);
            },
            (error) => {
              console.log('Geolocation error, using default:', error);
              fetchPrices(lat, lon);
            }
          );
        } else {
          fetchPrices(lat, lon);
        }
        
        async function fetchPrices(latitude, longitude) {
          const response = await fetch(`${apiBase}/market-prices?lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          if (data.ok) {
            console.log('Market prices received:', data);
            setMarketPrices(data.crops || []);
            setMarketPricesError(false);
          } else {
            console.log('Market prices API error:', data.error);
            setMarketPrices([]);
            setMarketPricesError(true);
          }
        }
      } catch (error) {
        console.error('Error fetching market prices:', error);
        setMarketPrices([]);
        setMarketPricesError(true);
      }
    };

    fetchMarketPrices();
  }, [apiBase]);

  // Fetch all crops from API
  useEffect(() => {
    const fetchAllCrops = async () => {
      try {
        const response = await fetch(`${apiBase}/all-crops`);
        const data = await response.json();
        
        if (data.ok) {
          console.log('All crops received:', data.crops);
          setAllCrops(data.crops || []);
          setAllCropsError(false);
        } else {
          console.log('All crops API error:', data.error);
          setAllCrops([]);
          setAllCropsError(true);
        }
      } catch (error) {
        console.error('Error fetching all crops:', error);
        setAllCrops([]);
        setAllCropsError(true);
      }
    };

    fetchAllCrops();
  }, [apiBase]);

  // Fetch buyer deals for signed-in buyer
  useEffect(() => {
    if (userRole !== 'buyer') {
      return;
    }

    const fetchBuyerDeals = async () => {
      setBuyerDealsLoading(true);
      try {
        const buyerId = localStorage.getItem('agriai_id');
        if (!buyerId) {
          setBuyerDealsLoading(false);
          return;
        }

        const response = await fetch(`${apiBase}/buyer-deals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ buyer_id: parseInt(buyerId) }),
        });
        const data = await response.json();

        if (data.ok) {
          console.log('Buyer deals received:', data);
          setBuyerDeals(data.deals || []);
        } else {
          console.log('Buyer deals API error:', data.error);
          setBuyerDeals([]);
        }
      } catch (error) {
        console.error('Error fetching buyer deals:', error);
        setBuyerDeals([]);
      } finally {
        setBuyerDealsLoading(false);
      }
    };

    fetchBuyerDeals();
  }, [apiBase, userRole]);

  // Fetch buyer contracts for signed-in buyer
  useEffect(() => {
    if (userRole !== 'buyer') {
      return;
    }

    const fetchBuyerContracts = async () => {
      setBuyerContractsLoading(true);
      try {
        const buyerId = localStorage.getItem('agriai_id');
        if (!buyerId) {
          setBuyerContractsLoading(false);
          return;
        }

        const response = await fetch(`${apiBase}/buyer-contracts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ buyer_id: parseInt(buyerId) }),
        });
        const data = await response.json();

        if (data.ok) {
          console.log('Buyer contracts received:', data);
          setBuyerContracts(data.contracts || []);
        } else {
          console.log('Buyer contracts API error:', data.error);
          setBuyerContracts([]);
        }
      } catch (error) {
        console.error('Error fetching buyer contracts:', error);
        setBuyerContracts([]);
      } finally {
        setBuyerContractsLoading(false);
      }
    };

    fetchBuyerContracts();
  }, [apiBase, userRole]);

  // Fetch buyer accepted contracts for signed-in buyer
  useEffect(() => {
    if (userRole !== 'buyer') {
      return;
    }

    const fetchBuyerAcceptedContracts = async () => {
      setBuyerAcceptedContractsLoading(true);
      try {
        const buyerId = localStorage.getItem('agriai_id');
        if (!buyerId) {
          setBuyerAcceptedContractsLoading(false);
          return;
        }

        const response = await fetch(`${apiBase}/buyer-accepted-contracts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ buyer_id: parseInt(buyerId) }),
        });
        const data = await response.json();

        if (data.ok) {
          console.log('Buyer accepted contracts received:', data);
          setBuyerAcceptedContracts(data.contracts || []);
        } else {
          console.log('Buyer accepted contracts API error:', data.error);
          setBuyerAcceptedContracts([]);
        }
      } catch (error) {
        console.error('Error fetching buyer accepted contracts:', error);
        setBuyerAcceptedContracts([]);
      } finally {
        setBuyerAcceptedContractsLoading(false);
      }
    };

    fetchBuyerAcceptedContracts();
  }, [apiBase, userRole]);

  // Fetch buyer rejected contracts for signed-in buyer
  useEffect(() => {
    if (userRole !== 'buyer') {
      return;
    }

    const fetchBuyerRejectedContracts = async () => {
      setBuyerRejectedContractsLoading(true);
      try {
        const buyerId = localStorage.getItem('agriai_id');
        if (!buyerId) {
          setBuyerRejectedContractsLoading(false);
          return;
        }

        const response = await fetch(`${apiBase}/buyer-rejected-contracts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ buyer_id: parseInt(buyerId) }),
        });
        const data = await response.json();

        if (data.ok) {
          console.log('Buyer rejected contracts received:', data);
          setBuyerRejectedContracts(data.contracts || []);
        } else {
          console.log('Buyer rejected contracts API error:', data.error);
          setBuyerRejectedContracts([]);
        }
      } catch (error) {
        console.error('Error fetching buyer rejected contracts:', error);
        setBuyerRejectedContracts([]);
      } finally {
        setBuyerRejectedContractsLoading(false);
      }
    };

    fetchBuyerRejectedContracts();
  }, [apiBase, userRole]);

  // Fetch monthly prices for selected crop and state
  useEffect(() => {
    if (!selectedCrop) {
      setMonthlyPrices([]);
      return;
    }

    const fetchMonthlyPrices = async () => {
      try {
        const stateParam = selectedState ? `&state=${encodeURIComponent(selectedState)}` : '';
        const response = await fetch(`${apiBase}/monthly-prices?crop=${encodeURIComponent(selectedCrop)}${stateParam}`);
        const data = await response.json();
        
        if (data.ok) {
          console.log('Monthly prices received:', data);
          setMonthlyPrices(data.prices || []);
          setMonthlyPricesError(false);
        } else {
          console.log('Monthly prices API error:', data.error);
          setMonthlyPrices([]);
          setMonthlyPricesError(true);
        }
      } catch (error) {
        console.error('Error fetching monthly prices:', error);
        setMonthlyPrices([]);
        setMonthlyPricesError(true);
      }
    };

    fetchMonthlyPrices();
  }, [selectedCrop, selectedState, apiBase]);

  // Fetch state-wise prices for bar chart
  useEffect(() => {
    if (!stateWiseCrop) {
      setStateWiseData([]);
      return;
    }

    const fetchStateWiseData = async () => {
      try {
        const response = await fetch(`${apiBase}/state-wise-prices?crop=${encodeURIComponent(stateWiseCrop)}`);
        const data = await response.json();
        
        if (data.ok) {
          console.log('State-wise prices received:', data);
          setStateWiseData(data.prices || []);
          setStateWiseError(false);
        } else {
          console.log('State-wise prices API error:', data.error);
          setStateWiseData([]);
          setStateWiseError(true);
        }
      } catch (error) {
        console.error('Error fetching state-wise prices:', error);
        setStateWiseData([]);
        setStateWiseError(true);
      }
    };

    fetchStateWiseData();
  }, [stateWiseCrop, apiBase]);

  // Fetch district-wise prices for bar chart
  useEffect(() => {
    if (!districtWiseCrop || !districtWiseState) {
      setDistrictWiseData([]);
      return;
    }

    const fetchDistrictWiseData = async () => {
      try {
        const response = await fetch(`${apiBase}/district-wise-prices?crop=${encodeURIComponent(districtWiseCrop)}&state=${encodeURIComponent(districtWiseState)}`);
        const data = await response.json();
        
        if (data.ok) {
          console.log('District-wise prices received:', data);
          setDistrictWiseData(data.districts || []);
          setDistrictWiseError(false);
        } else {
          console.log('District-wise prices API error:', data.error);
          setDistrictWiseData([]);
          setDistrictWiseError(true);
        }
      } catch (error) {
        console.error('Error fetching district-wise prices:', error);
        setDistrictWiseData([]);
        setDistrictWiseError(true);
      }
    };

    fetchDistrictWiseData();
  }, [districtWiseCrop, districtWiseState, apiBase]);

  // Fetch contract data for farmers
  useEffect(() => {
    if (userRole !== 'farmer') {
      setLoading(false);
      return;
    }

    const fetchContractStats = async () => {
      try {
        const farmerId = localStorage.getItem('agriai_id');
        if (!farmerId) {
          console.log('No farmer ID found');
          setLoading(false);
          return;
        }

        // Fetch contracts from BOTH tables in parallel
        const [contractsBResponse, contractsResponse] = await Promise.all([
          fetch(`${apiBase}/farmer/contracts-b?farmer_id=${farmerId}`),
          fetch(`${apiBase}/farmer/contracts?farmer_id=${farmerId}`)
        ]);

        const contractsBData = await contractsBResponse.json();
        const contractsData = await contractsResponse.json();

        // Combine contracts from both tables
        let allContracts = [];
        
        if (contractsBData.ok && contractsBData.contracts) {
          allContracts = [...allContracts, ...contractsBData.contracts];
        }
        
        if (contractsData.ok && contractsData.contracts) {
          allContracts = [...allContracts, ...contractsData.contracts];
        }

        console.log('All contracts from both tables:', allContracts.length);

        if (allContracts.length > 0) {
          // Calculate stats from combined contracts
          const activeContracts = allContracts.filter(c => c.status === 'accepted').length;
          const rejectedContracts = allContracts.filter(c => c.status === 'rejected').length;
          
          // Pending deals include: pending, negotiated, farmer_negotiated, buyer_negotiated
          const pendingStatuses = ['pending', 'negotiated', 'farmer_negotiated', 'buyer_negotiated'];
          const pendingDeals = allContracts.filter(c => pendingStatuses.includes(c.status)).length;
          
          // Calculate revenue from ALL accepted contracts (not just this month)
          let revenueThisMonth = 0;
          allContracts.forEach(contract => {
            if (contract.status === 'accepted') {
              // Sum up farmer_total from all accepted contracts
              const amount = parseFloat(contract.farmer_total || contract.amount || 0);
              if (!isNaN(amount)) {
                revenueThisMonth += amount;
              }
            }
          });

          console.log('Revenue calculation:', {
            totalAccepted: allContracts.filter(c => c.status === 'accepted').length,
            revenueThisMonth
          });

          setContractStats({
            activeContracts,
            pendingDeals,
            rejectedContracts,
            revenueThisMonth,
            revenueChange: 12.5
          });
        } else {
          setContractStats({
            activeContracts: 0,
            pendingDeals: 0,
            rejectedContracts: 0,
            revenueThisMonth: 0,
            revenueChange: 0
          });
        }
      } catch (error) {
        console.error('Error fetching contract stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContractStats();
  }, [userRole, apiBase]);

  // Different data based on user role
  const isFarmer = userRole === 'farmer';
  
  const farmerData = {
    stats: [
      { key: 'activeContracts', label: t('insightsActiveContracts', siteLang) || 'Active Contracts', value: contractStats.activeContracts, icon: 'BarChart3', color: '#1a5c10', border: '#e8f5e9' },
      { key: 'pendingDeals', label: t('insightsPendingDeals', siteLang) || 'Pending Contracts', value: contractStats.pendingDeals, icon: 'TrendingUp', color: '#f57c00', border: '#fff3e0' },
      { key: 'rejectedContracts', label: t('insightsRejectedContracts', siteLang) || 'Rejected Contracts', value: contractStats.rejectedContracts, icon: 'TrendingUp', color: '#dc2626', border: '#fee2e2' },
      { key: 'revenue', label: t('insightsRevenue', siteLang) || 'Total Revenue', value: `₹${contractStats.revenueThisMonth.toLocaleString()}`},
    ],
    weatherInsights: {
      temperature: weatherData.temperature !== null ? weatherData.temperature : '...',
      humidity: weatherData.humidity !== null ? weatherData.humidity : '...',
      rainfall: weatherData.rainfall,
      rainfall_value: weatherData.rainfall_value,
      recommendation: weatherData.recommendation,
      place_name: weatherData.place_name
    },
    marketTrends: marketPrices.length > 0 ? marketPrices : [],
    yieldData: [
      { crop: 'Rice', yield: 45, target: 50 },
      { crop: 'Wheat', yield: 38, target: 40 },
      { crop: 'Cotton', yield: 22, target: 25 },
      { crop: 'Sugarcane', yield: 350, target: 400 },
    ]
  };

  // Calculate total spent from accepted contracts
  const totalSpentAmount = buyerAcceptedContracts.reduce((sum, contract) => sum + (contract.buyer_total || contract.amount || 0), 0);
  const totalSpentFormatted = `₹${totalSpentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const buyerData = {
    stats: [
      { key: 'completedOrders', label: t('insightsAcceptedContracts', siteLang) || 'Accepted Contracts', value: buyerAcceptedContracts.length, icon: 'ShoppingCart', color: '#1a5c10', border: '#dcfce7' },
      { key: 'pendingOrders', label: t('insightsPendingOrders', siteLang) || 'Pending Contracts', value: buyerContracts.length, icon: 'Package', color: '#f57c00', border: '#fff3e0' },
      { key: 'rejectedContracts', label: t('insightsRejectedContracts', siteLang) || 'Rejected Contracts', value: buyerRejectedContracts.length, icon: 'TrendingUp', color: '#dc2626', border: '#fee2e2' },
      { key: 'totalSpent', label: t('insightsTotalSpent', siteLang) || 'Total Spent (This Month)', value: totalSpentFormatted, color: '#1a5c10', border: '#e8f5e9' },
    ],
    weatherInsights: {
      temperature: weatherData.temperature !== null ? weatherData.temperature : '...',
      humidity: weatherData.humidity !== null ? weatherData.humidity : '...',
      rainfall: weatherData.rainfall,
      rainfall_value: weatherData.rainfall_value,
      recommendation: weatherData.recommendation,
      place_name: weatherData.place_name
    },
    marketTrends: marketPrices.length > 0 ? marketPrices : [],

    sellerData: [
      { name: 'Ravi Kumar', crops: 'Rice, Wheat', orders: 5, rating: 4.8 },
      { name: 'Priya Singh', crops: 'Vegetables', orders: 3, rating: 4.5 },
      { name: 'Mahendra Patel', crops: 'Cotton, Soybean', orders: 4, rating: 4.2 },
    ]
  };

  const currentData = isFarmer ? farmerData : buyerData;
  const iconMap = { BarChart3, TrendingUp, TrendingDown, ShoppingCart, Package, DollarSign, Users };

  const getIcon = (iconName, size = 32, color = '#1a5c10', style = {}) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent size={size} color={color} style={style} /> : <BarChart3 size={size} color={color} style={style} />;
  };

  return (
    <div style={{ background: 'rgba(83, 255, 3, 0.12)', backgroundAttachment: 'fixed', minHeight: '100vh', color: '#000', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .mc-root .navbar {
          background: oklch(0.12 0.03 160 / 0.5) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }
        .mc-root .navbar select {
          background: oklch(0.12 0.03 160 / 0.6) !important;
          border: 1px solid oklch(0.65 0.22 145 / 0.3) !important;
          color: rgba(255,255,255,0.9) !important;
        }
        .mc-root .navbar select option {
          background: #1a1a1a;
          color: #ffffff;
        }
      `}</style>
      <div className="mc-root">
        <Navbar />
        <main style={{padding: '6rem 1rem 6rem', position: 'relative', zIndex: 1, display:'flex', justifyContent:'center'}}>
          <div style={{display:'inline-block', width:'auto', margin:'0 auto',background:'rgba(255,255,255,0.92)',backdropFilter:'blur(20px) saturate(1.6)',WebkitBackdropFilter:'blur(20px) saturate(1.6)',border:'1px solid rgba(255,255,255,0.6)',borderRadius:'24px',padding:'2.5rem',boxShadow:'0 8px 32px rgba(35,105,2,0.12), 0 32px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)'}}>
            <h1 style={{backgroundImage:'linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%)',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent',textAlign:'center',marginBottom:40,fontSize:'2rem',fontWeight:800,margin:0}}>
              {isFarmer ? (t('insightsTitle', siteLang) || 'Agricultural Insights') : (t('insightsBuyerTitle', siteLang) || 'Buyer Dashboard')}
            </h1>

            {/* Stats Cards */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'nowrap', overflowX: 'auto' }}>
              {loading ? (
                <div style={{ width: '100%', textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: '#666' }}>Loading contract data...</p>
                </div>
              ) : (
                currentData.stats.map((stat, index) => (
                  <div key={index} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: `1px solid ${stat.border}`, minWidth: '280px', flex: '1 1 0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      {getIcon(stat.icon, 32, stat.color, { marginBottom: '8px' })}
                      <div>
                        <p style={{ color: '#1a5c10', fontSize: '20px', margin: '0 0 6px 0', fontWeight: 600 }}>{stat.label}</p>
                        <p style={{ fontSize: '34px', fontWeight: '700', color: '#1a5c10', margin: 0 }}>{stat.value}</p>
                        {stat.change && (
                          <p style={{ color: '#16a34a', fontSize: '13px', margin: '6px 0 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <TrendingUp size={12} />
                            {stat.change}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Weather & Market Section */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'nowrap', overflowX: 'auto' }}>
              {/* Weather Card */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8f5e9', minWidth: '450px', flex: '1 1 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a5c10', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: 0 }}>
                    <Sun size={20} />
                    {t('insightsWeather', siteLang) || 'Weather Insights'}
                  </h2>
                  <p style={{ fontSize: '16px', color: '#000000', margin: '4px 0 0 0' }}>
                    {currentData.weatherInsights.place_name || 'Loading...'}
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div style={{ textAlign: 'center', padding: '14px', background: '#f9fafb', borderRadius: '10px' }}>
                    <Sun size={20} color="#f59e0b" style={{ margin: '0 auto 6px' }} />
                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#1a5c10', margin: 0 }}>{currentData.weatherInsights.temperature}°C</p>
                    <p style={{ fontSize: '16px', color: '#000000', margin: '4px 0 0 0' }}>{t('insightsTemperature', siteLang) || 'Temperature'}</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '14px', background: '#f9fafb', borderRadius: '10px' }}>
                    <Droplets size={20} color="#3b82f6" style={{ margin: '0 auto 6px' }} />
                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#1a5c10', margin: 0 }}>{currentData.weatherInsights.humidity}%</p>
                    <p style={{ fontSize: '16px', color: '#000000', margin: '4px 0 0 0' }}>{t('insightsHumidity', siteLang) || 'Humidity'}</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '14px', background: '#f9fafb', borderRadius: '10px' }}>
                    <TrendingDown size={20} color="#8b5cf6" style={{ margin: '0 auto 6px' }} />
                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#1a5c10', margin: 0 }}>{currentData.weatherInsights.rainfall_value > 0 ? `${currentData.weatherInsights.rainfall_value}mm` : currentData.weatherInsights.rainfall}</p>
                    <p style={{ fontSize: '16px', color: '#000000', margin: '4px 0 0 0' }}>{t('insightsRainfall', siteLang) || 'Rainfall'}</p>
                  </div>
                </div>
                <div style={{ marginTop: '12px', padding: '10px', background: '#e8f5e9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Info size={14} color="#1a5c10" />
                  <p style={{ fontSize: '18px', color: '#1a5c10', margin: 0, textAlign: 'center' }}>{currentData.weatherInsights.recommendation}</p>
                </div>
              </div>

              {/* Market Trends Card */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8f5e9', minWidth: '450px', flex: '1 1 0' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a5c10', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <TrendingUp size={20} />
                  {t('insightsMarketTrends', siteLang) || 'Market Price Trends'}
                </h2>
                
                {marketPricesError ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#dc2626' }}>
                    <p>{t('insightsUnableLoadMarket', siteLang) || 'Unable to load market prices. Please check your API connection.'}</p>
                  </div>
                ) : currentData.marketTrends.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {currentData.marketTrends.slice(0, 4).map((item, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
                        <div>
                          <p style={{ fontWeight: '600', color: '#1a5c10', margin: 0, fontSize: '14px' }}>{item.crop}</p>
                          <p style={{ fontSize: '14px', color: '#000000', margin: '2px 0 0 0' }}>₹{item.price}{t('insightsQuintal', siteLang) || '/quintal'}</p>
                        </div>
                        <div style={{ 
                          padding: '4px 10px', 
                          borderRadius: '16px', 
                          background: item.change >= 0 ? '#e8f5e9' : '#fee2e2',
                          color: item.change >= 0 ? '#16a34a' : '#dc2626'
                        }}>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>
                            {item.change >= 0 ? '+' : ''}{item.change}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    <p>{t('insightsLoadingMarket', siteLang) || 'Loading market prices...'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Insights - For All Users */}
            {(
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8f5e9' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a5c10', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <BarChart3 size={18} />
                  {t('insightsMonthlyInsights', siteLang) || 'Monthly Insights'}
                </h2>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{ flex: '1 1 200px', maxWidth: '300px', textAlign: 'center' }}>
                    <label style={{ fontSize: '16px', color: '#000000', marginBottom: '8px', display: 'block', textAlign: 'center' }}>
                      {t('insightsSelectCrop', siteLang) || 'Select Crop:'}
                    </label>
                    <select 
                      value={selectedCrop}
                      onChange={(e) => setSelectedCrop(e.target.value)}
                      disabled={allCropsError}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        fontSize: '14px', 
                        border: '1px solid #e8f5e9', 
                        borderRadius: '8px',
                        background: '#fff',
                        color: allCropsError ? '#dc2626' : '#000000',
                        cursor: allCropsError ? 'not-allowed' : 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <option value="">{allCropsError ? 'API Unavailable' : (t('insightsChooseCrop', siteLang) || '-- Choose a crop --')}</option>
                      {!allCropsError && allCrops.map((crop, index) => (
                        <option key={index} value={crop}>{crop}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: '1 1 200px', maxWidth: '300px', textAlign: 'center' }}>
                    <label style={{ fontSize: '14px', color: '#000000', marginBottom: '8px', display: 'block', textAlign: 'center' }}>
                      {t('insightsSelectState', siteLang) || 'Select State:'}
                    </label>
                    <select 
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      disabled={allCropsError}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        fontSize: '14px', 
                        border: '1px solid #e8f5e9', 
                        borderRadius: '8px',
                        background: '#fff',
                        color: allCropsError ? '#dc2626' : '#000000',
                        cursor: allCropsError ? 'not-allowed' : 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <option value="">{t('insightsChooseState', siteLang) || '-- All States --'}</option>
                      {indianStates.map((state, index) => (
                        <option key={index} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {monthlyPricesError ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#dc2626' }}>
                    <p>{t('insightsUnableLoadMonthly', siteLang) || 'Unable to load monthly prices. Please check your API connection.'}</p>
                  </div>
                ) : selectedCrop && monthlyPrices.length > 0 && !monthlyPricesError && (
                  <div>
                    <p style={{ fontSize: '16px', color: '#000000', marginBottom: '12px', textAlign: 'center' }}>
                      {selectedCrop} {selectedState ? `- ${selectedState}` : ''} {t('insightsPriceHistory', siteLang) || 'Price History (Last 12 Months)'}
                    </p>
                    {/* Line Chart */}
                    <div style={{ position: 'relative', height: '260px', padding: '10px 0' }}>
                      <svg width="100%" height="240" viewBox="0 0 600 220" preserveAspectRatio="none">
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4].map((i) => (
                          <line 
                            key={i}
                            x1="40" 
                            y1={30 + i * 40} 
                            x2="580" 
                            y2={30 + i * 40} 
                            stroke="#e5e7eb" 
                            strokeWidth="1"
                            strokeDasharray="4"
                          />
                        ))}
                        {/* Price line - from past to current (left to right) */}
                        {monthlyPrices.length > 1 && (() => {
                          const maxPrice = Math.max(...monthlyPrices.map(p => p.price));
                          const minPrice = Math.min(...monthlyPrices.map(p => p.price));
                          const priceRange = maxPrice - minPrice || 1;
                          const points = monthlyPrices.map((item, index) => {
                            const x = 50 + (index * (530 / (monthlyPrices.length - 1)));
                            const y = 190 - ((item.price - minPrice) / priceRange) * 150;
                            return `${x},${y}`;
                          }).join(' ');
                          return (
                            <polyline 
                              points={points} 
                              fill="none" 
                              stroke="#1a5c10" 
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          );
                        })()}
                        {/* Data points */}
                        {monthlyPrices.map((item, index) => {
                          const maxPrice = Math.max(...monthlyPrices.map(p => p.price));
                          const minPrice = Math.min(...monthlyPrices.map(p => p.price));
                          const priceRange = maxPrice - minPrice || 1;
                          const x = 50 + (index * (530 / (monthlyPrices.length - 1)));
                          const y = 190 - ((item.price - minPrice) / priceRange) * 150;
                          return (
                            <g key={index}>
                              <circle cx={x} cy={y} r="5" fill="#1a5c10" stroke="#fff" strokeWidth="2" />
                              <text x={x} y={215} textAnchor="middle" fontSize="10" fill="#000000">{item.month} '{item.year}</text>
                              <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="#1a5c10">₹{item.price}</text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '16px', color: '#1a5c10' }}>
                      <span>Min: ₹{Math.min(...monthlyPrices.map(p => p.price))}</span>
                      <span>Max: ₹{Math.max(...monthlyPrices.map(p => p.price))}</span>
                      <span>Avg: ₹{Math.round(monthlyPrices.reduce((a, b) => a + b.price, 0) / monthlyPrices.length)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* State Wise Insights - For All Users */}
            {(
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8f5e9', marginTop: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a5c10', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <BarChart3 size={18} />
                  {t('insightsStateWiseInsights', siteLang) || 'State Wise Insights'}
                </h2>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{ flex: '1 1 200px', maxWidth: '300px', textAlign: 'center' }}>
                    <label style={{ fontSize: '16px', color: '#000000', marginBottom: '8px', display: 'block', textAlign: 'center' }}>
                      {t('insightsSelectCrop', siteLang) || 'Select Crop:'}
                    </label>
                    <select 
                      value={stateWiseCrop}
                      onChange={(e) => setStateWiseCrop(e.target.value)}
                      disabled={allCropsError}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        fontSize: '14px', 
                        border: '1px solid #e8f5e9', 
                        borderRadius: '8px',
                        background: '#fff',
                        color: allCropsError ? '#dc2626' : '#000000',
                        cursor: allCropsError ? 'not-allowed' : 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <option value="">{allCropsError ? (t('insightsApiUnavailable', siteLang) || 'API Unavailable') : (t('insightsChooseCrop', siteLang) || '-- Choose a crop --')}</option>
                      {!allCropsError && allCrops.map((crop, index) => (
                        <option key={index} value={crop}>{crop}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {stateWiseError ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#dc2626' }}>
                    <p>{t('insightsUnableLoadState', siteLang) || 'Unable to load state-wise prices. Please check your API connection.'}</p>
                  </div>
                ) : stateWiseCrop && stateWiseData.length > 0 && !stateWiseError && (
                  <div>
                    <p style={{ fontSize: '16px', color: '#000000', marginBottom: '12px', textAlign: 'center' }}>
                      {stateWiseCrop} - {t('insightsCropState', siteLang) || 'Top 10 States by Price'}
                    </p>
                    {/* Bar Chart */}
                    <div style={{ position: 'relative', height: '300px', padding: '10px 0' }}>
                      <svg width="100%" height="280" viewBox="0 0 700 260" preserveAspectRatio="none">
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4].map((i) => (
                          <line 
                            key={i}
                            x1="60" 
                            y1={20 + i * 50} 
                            x2="650" 
                            y2={20 + i * 50} 
                            stroke="#e5e7eb" 
                            strokeWidth="1"
                            strokeDasharray="4"
                          />
                        ))}
                        {/* Bars */}
                        {stateWiseData.map((item, index) => {
                          const maxPrice = Math.max(...stateWiseData.map(p => p.price));
                          const minPrice = Math.min(...stateWiseData.map(p => p.price));
                          // Use a minimum height to make differences more visible
                          const normalizedHeight = ((item.price - minPrice) / (maxPrice - minPrice || 1));
                          const barHeight = 30 + (normalizedHeight * 130); // Min 30px, max 160px
                          const x = 70 + (index * 60);
                          const y = 230 - barHeight;
                          // Format state name properly
                          const stateName = item.state === 'Uttar Pradesh' ? 'Uttar Pradesh' :
                                           item.state === 'Himachal Pradesh' ? 'Himachal Pradesh' :
                                           item.state === 'West Bengal' ? 'West Bengal' :
                                           item.state === 'Andhra Pradesh' ? 'Andhra Pradesh' :
                                           item.state === 'Tamil Nadu' ? 'Tamil Nadu' :
                                           item.state;
                          return (
                            <g key={index}>
                              <rect 
                                x={x} 
                                y={y} 
                                width="35" 
                                height={barHeight} 
                                fill="#1a5c10" 
                                rx="4"
                              />
                              <text x={x + 17} y={245} textAnchor="middle" fontSize="9" fill="#000000">{stateName}</text>
                              <text x={x + 17} y={y - 5} textAnchor="middle" fontSize="9" fill="#1a5c10">₹{item.price}</text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '16px', color: '#1a5c10' }}>
                      <span>{t('insightsLowest', siteLang) || 'Lowest'}: ₹{Math.min(...stateWiseData.map(p => p.price))}</span>
                      <span>{t('insightsHighest', siteLang) || 'Highest'}: ₹{Math.max(...stateWiseData.map(p => p.price))}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* District Wise Insights - For All Users */}
            {(
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e8f5e9', marginTop: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a5c10', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <BarChart3 size={18} />
                  {t('insightsDistrictWiseInsights', siteLang) || 'District Wise Insights'}
                </h2>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{ flex: '1 1 200px', maxWidth: '300px', textAlign: 'center' }}>
                    <label style={{ fontSize: '16px', color: '#000000', marginBottom: '8px', display: 'block', textAlign: 'center' }}>
                      {t('insightsSelectCrop', siteLang) || 'Select Crop:'}
                    </label>
                    <select 
                      value={districtWiseCrop}
                      onChange={(e) => setDistrictWiseCrop(e.target.value)}
                      disabled={allCropsError}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        fontSize: '14px', 
                        border: '1px solid #e8f5e9', 
                        borderRadius: '8px',
                        background: '#fff',
                        color: allCropsError ? '#dc2626' : '#000000',
                        cursor: allCropsError ? 'not-allowed' : 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <option value="">{allCropsError ? (t('insightsApiUnavailable', siteLang) || 'API Unavailable') : (t('insightsChooseCrop', siteLang) || '-- Choose a crop --')}</option>
                      {!allCropsError && allCrops.map((crop, index) => (
                        <option key={index} value={crop}>{crop}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: '1 1 200px', maxWidth: '300px', textAlign: 'center' }}>
                    <label style={{ fontSize: '16px', color: '#000000', marginBottom: '8px', display: 'block', textAlign: 'center' }}>
                      {t('insightsSelectState', siteLang) || 'Select State:'}
                    </label>
                    <select 
                      value={districtWiseState}
                      onChange={(e) => setDistrictWiseState(e.target.value)}
                      disabled={allCropsError}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        fontSize: '14px', 
                        border: '1px solid #e8f5e9', 
                        borderRadius: '8px',
                        background: '#fff',
                        color: allCropsError ? '#dc2626' : '#000000',
                        cursor: allCropsError ? 'not-allowed' : 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <option value="">{allCropsError ? (t('insightsApiUnavailable', siteLang) || 'API Unavailable') : (t('insightsChooseState', siteLang) || '-- Choose a state --')}</option>
                      {!allCropsError && ['Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan', 'Andhra Pradesh', 'Telangana', 'Odisha', 'Bihar', 'Jharkhand', 'Chhattisgarh', 'Assam', 'Kerala', 'Uttarakhand', 'Himachal Pradesh'].map((state, index) => (
                        <option key={index} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {districtWiseError ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#dc2626' }}>
                    <p>{t('insightsUnableLoadDistrict', siteLang) || 'Unable to load district-wise prices. Please check your API connection.'}</p>
                  </div>
                ) : districtWiseCrop && districtWiseState && districtWiseData.length > 0 && !districtWiseError && (
                  <div>
                    <p style={{ fontSize: '16px', color: '#000000', marginBottom: '12px', textAlign: 'center' }}>
                      {districtWiseCrop} - {t('insightsCropDistrict', siteLang) || 'Top 10 Districts in'} {districtWiseState}
                    </p>
                    {/* Horizontal Bar Chart */}
                    <div style={{ position: 'relative', padding: '10px 0' }}>
                      <svg width="100%" height="350" viewBox="0 0 700 320" preserveAspectRatio="none">
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4].map((i) => (
                          <line 
                            key={i}
                            x1="120" 
                            y1={20 + i * 65} 
                            x2="680" 
                            y2={20 + i * 65} 
                            stroke="#e5e7eb" 
                            strokeWidth="1"
                            strokeDasharray="4"
                          />
                        ))}
                        {/* Horizontal Bars */}
                        {districtWiseData.map((item, index) => {
                          const maxPrice = Math.max(...districtWiseData.map(p => p.price));
                          const minPrice = Math.min(...districtWiseData.map(p => p.price));
                          // Use a minimum width to make differences more visible
                          const normalizedWidth = ((item.price - minPrice) / (maxPrice - minPrice || 1));
                          const barWidth = 30 + (normalizedWidth * 450); // Min 30px, max 480px
                          const y = 30 + (index * 28);
                          const x = 110;
                          // Format district name properly
                          const districtName = item.district.length > 12 ? item.district.substring(0, 12) + '...' : item.district;
                          return (
                            <g key={index}>
                              <text x="105" y={y + 16} textAnchor="end" fontSize="10" fill="#000000">{districtName}</text>
                              <rect 
                                x={x} 
                                y={y} 
                                width={barWidth} 
                                height="20" 
                                fill="#1a5c10" 
                                rx="4"
                              />
                              <text x={x + barWidth + 5} y={y + 16} textAnchor="start" fontSize="10" fill="#1a5c10">₹{item.price}</text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '16px', color: '#1a5c10' }}>
                      <span>{t('insightsLowest', siteLang) || 'Lowest'}: ₹{Math.min(...districtWiseData.map(p => p.price))}</span>
                      <span>{t('insightsHighest', siteLang) || 'Highest'}: ₹{Math.max(...districtWiseData.map(p => p.price))}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>

        {/* Footer */}
        <footer className="w-full border-t" style={{background:'oklch(0.12 0.03 160 / 0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderColor:'oklch(0.65 0.22 145 / 0.12)', padding:'1em 0'}}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 font-bold text-xl mb-2">
                  <div className="w-7 h-7 rounded-lg border border-primary/40 flex items-center justify-center" style={{background:'oklch(0.65 0.22 145 / 0.2)', borderColor:'oklch(0.65 0.22 145)'}}>
                    <Leaf className="w-3.5 h-3.5" style={{color:'oklch(0.65 0.22 145)'}} />
                  </div>
                  <span style={{color:'oklch(0.65 0.22 145)', fontFamily:"'Times New Roman', Times, serif"}}>AgriAI</span>
                </div>
                <p className="text-white text-sm leading-relaxed" style={{fontFamily:"'Times New Roman', Times, serif"}}>
                  {t('footerDescription', siteLang)}
                </p>
              </div>

              {[
                { title: t('footerPlatform', siteLang), links: ['footerAbout', 'footerHowItWorks', 'footerFeatures', 'footerPricing'] },
                { title: t('footerUsers', siteLang), links: ['footerFarmers', 'footerBuyers', 'footerAgribusiness', 'footerPartners'] },
                { title: t('footerLegal', siteLang), links: ['footerPrivacy', 'footerTerms', { label: t('footerContact', siteLang), path: "/contact" }] },
              ].map((col) => (
                <div key={col.title}>
                  <h4 className="font-semibold text-white mb-2" style={{fontFamily:"'Times New Roman', Times, serif"}}>{col.title}</h4>
                  <ul className="space-y-1">
                    {col.links.map((link) => {
                      const label = typeof link === 'string' ? t(link, siteLang) : link.label;
                      const path = typeof link === 'string' ? "/" : link.path;
                      return (
                        <li key={label}>
                          {path === "/contact" ? (
                            <Link to="/contact" className="text-white text-sm transition-colors" style={{fontFamily:"'Times New Roman', Times, serif"}}>
                              {label}
                            </Link>
                          ) : (
                            <a href={path} className="text-white text-sm transition-colors" style={{fontFamily:"'Times New Roman', Times, serif"}}>
                              {label}
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <div className="pt-3 flex justify-center items-center text-white text-sm" style={{borderTop:'1px solid oklch(0.65 0.22 145 / 0.12)', fontFamily:"'Times New Roman', Times, serif"}}>
              <span>
                © {new Date().getFullYear()} AgriAI. {t('footerRights', siteLang)}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}