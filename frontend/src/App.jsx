import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { CircleMarker, GeoJSON, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  BellRing,
  Building2,
  CheckCircle2,
  Clock3,
  CloudRain,
  Crosshair,
  Gauge,
  Hospital,
  Layers3,
  MapPin,
  Navigation,
  Play,
  Radio,
  Route,
  Search,
  ShieldCheck,
  Siren,
  Users,
  Waves,
} from 'lucide-react'
import './App.css'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api', timeout: 8000 })

const fallbackData = {
  status: 'operational',
  event_name: 'Monsoon Surge - District West',
  district: 'Patna',
  state: 'Bihar',
  severity: 'Extreme',
  warning_source: 'SIMULATED / DEMONSTRATION',
  risk_score: 82.4,
  people_at_risk: 128450,
  water_coverage: 38.2,
  alert_window_hours: 6.5,
  map_center: [25.618, 85.156],
  zones: [
    { id: 1, name: 'North River Belt', severity: 'critical', population: 42000, lat: 25.621, lon: 85.144, radius_meters: 5800, is_verified: false, status: 'evacuating' },
    { id: 2, name: 'Old Town Cluster', severity: 'high', population: 28100, lat: 25.612, lon: 85.165, radius_meters: 4300, is_verified: false, status: 'pending' },
    { id: 3, name: 'Canal Road', severity: 'medium', population: 17800, lat: 25.606, lon: 85.181, radius_meters: 2600, is_verified: false, status: 'monitoring' },
  ],
  shelters: [
    { id: 1, name: 'Patna City School Shelter', category: 'school', occupancy: 430, capacity: 850, lat: 25.6301, lon: 85.1532, accessible: true, status: 'open' },
    { id: 2, name: 'District Hospital Relief Center', category: 'hospital', occupancy: 220, capacity: 450, lat: 25.6152, lon: 85.1387, accessible: true, status: 'ready' },
    { id: 3, name: 'Municipal Annex Hall', category: 'government', occupancy: 310, capacity: 600, lat: 25.6039, lon: 85.1711, accessible: true, status: 'open' },
  ],
  rescue_teams: [
    { id: 1, name: 'Team Alpha', leader: 'Maj. Arun Singh', specialty: 'rapid evacuation', resources: 'boats, medics, drone', status: 'deployed', assigned_zone: 'North River Belt' },
    { id: 2, name: 'Team Bravo', leader: 'Capt. Meera Nair', specialty: 'infrastructure access', resources: 'ambulance, generators', status: 'mobilized', assigned_zone: 'Old Town Cluster' },
  ],
  reports: [
    { id: 1, reporter: 'R. Verma', locality: 'Kankarbagh', issue_type: 'road_blocked', severity: 'high', lat: 25.613, lon: 85.150, description: 'Road near the canal remains submerged and emergency vehicles are struggling to pass.', resolved: false },
    { id: 2, reporter: 'J. Khan', locality: 'Sultanganj', issue_type: 'water_level_rising', severity: 'medium', lat: 25.627, lon: 85.175, description: 'Water is entering the lower alleyways and residents are reporting rising water after the latest rain burst.', resolved: false },
  ],
  evacuation_priority: [
    'Priority 1: Low-lying riverbank settlements',
    'Priority 2: Medical and school zone access roads',
    'Priority 3: Elderly care neighborhoods',
  ],
  safe_routes: [
    { route: 'Route A', distance_km: 4.2, status: 'open' },
    { route: 'Route B', distance_km: 6.7, status: 'partially obstructed' },
    { route: 'Route C', distance_km: 3.1, status: 'clear' },
  ],
  facilities: [
    { id: 'school-patna', name: 'Patna Central School', category: 'school', lat: 25.6242, lon: 85.1772, status: 'open', source: 'SIMULATED / DEMONSTRATION' },
    { id: 'hospital-city', name: 'Patna City Hospital', category: 'hospital', lat: 25.609, lon: 85.1355, status: 'operational', source: 'SIMULATED / DEMONSTRATION' },
    { id: 'dam-kosi', name: 'Kosi Barrage', category: 'dam', lat: 25.59, lon: 85.205, status: 'monitored', source: 'SIMULATED / DEMONSTRATION' },
  ],
  routes: [
    { id: 'route-a', name: 'North River Belt → Patna City School Shelter', distance_km: 4.2, status: 'open', coordinates: [[25.621, 85.144], [25.625, 85.149], [25.6301, 85.1532]], source: 'SIMULATED / DEMONSTRATION' },
    { id: 'route-b', name: 'Old Town → District Hospital Relief Center', distance_km: 6.7, status: 'partially obstructed', coordinates: [[25.612, 85.165], [25.614, 85.15], [25.6152, 85.1387]], source: 'SIMULATED / DEMONSTRATION' },
  ],
  alerts: [],
  kpis: {
    peopleAtRisk: 128450,
    sheltersReady: 3,
    evacuationPercent: 72,
    alertsActive: 4,
  },
}

const navItems = [
  { label: 'Dashboard', id: 'dashboard' },
  { label: 'Flood Map', id: 'flood-map' },
  { label: 'Risk Analysis', id: 'risk-analysis' },
  { label: 'Evacuation', id: 'evacuation' },
  { label: 'Shelters', id: 'shelters' },
  { label: 'Safe Route', id: 'safe-route' },
  { label: 'Rescue Operations', id: 'rescue-operations' },
  { label: 'Request Help', id: 'citizen-help' },
  { label: 'Alerts', id: 'alerts' },
]

const zoneColors = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#facc15',
  low: '#22c55e',
}

const chartHistory = [
  { name: 'Mon', risk: 42 },
  { name: 'Tue', risk: 58 },
  { name: 'Wed', risk: 68 },
  { name: 'Thu', risk: 72 },
  { name: 'Fri', risk: 81 },
  { name: 'Sat', risk: 88 },
  { name: 'Sun', risk: 94 },
]

const hydrographHistory = [
  { name: '06:00', rainfall: 18, river: 6.8, population: 18 },
  { name: '08:00', rainfall: 24, river: 7.1, population: 23 },
  { name: '10:00', rainfall: 31, river: 7.5, population: 34 },
  { name: '12:00', rainfall: 42, river: 8.0, population: 46 },
  { name: '14:00', rainfall: 57, river: 8.7, population: 59 },
  { name: '16:00', rainfall: 68, river: 9.4, population: 73 },
  { name: '18:00', rainfall: 82, river: 10.2, population: 88 },
]

const routeColors = {
  open: '#34d399',
  'partially obstructed': '#fbbf24',
  clear: '#60a5fa',
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(value)
}

function buildLocalMapData(source) {
  return {
    zones: source.zones,
    zones_geojson: {
      type: 'FeatureCollection',
      features: source.zones.map((zone) => {
        const coordinates = Array.from({ length: 17 }, (_, index) => {
          const angle = (2 * Math.PI * index) / 16
          return [
            zone.lon + (Math.cos(angle) * zone.radius_meters) / 111320,
            zone.lat + (Math.sin(angle) * zone.radius_meters) / 110540,
          ]
        })
        return {
          type: 'Feature',
          properties: { ...zone, source: 'SIMULATED / DEMONSTRATION' },
          geometry: { type: 'Polygon', coordinates: [coordinates] },
        }
      }),
    },
    shelters: source.shelters,
    facilities: source.facilities,
    rescue_requests: source.reports,
    routes: source.routes,
    source: 'SIMULATED / DEMONSTRATION',
  }
}

function buildLocalAlerts(source) {
  return [
    ...source.zones
      .filter((zone) => ['critical', 'high'].includes(zone.severity))
      .map((zone) => ({
        id: `zone-${zone.id}`,
        title: `${zone.severity} flood risk: ${zone.name}`,
        description: `${formatNumber(zone.population)} residents may be affected.`,
        severity: zone.severity,
        source: 'SIMULATED / DEMONSTRATION',
      })),
    ...source.reports
      .filter((report) => (report.status || (report.resolved ? 'resolved' : 'pending')) !== 'resolved')
      .map((report) => ({
        id: `request-${report.id}`,
        title: `Rescue request: ${report.locality}`,
        description: report.description,
        severity: report.severity,
        source: 'SIMULATED / DEMONSTRATION',
      })),
  ]
}

function getLocalSimulationData(current, isDamBreak = false) {
  const riskScore = isDamBreak ? 99 : 94.2
  const zones = current.zones.map((zone, index) => ({
    ...zone,
    severity: index === 0 ? 'critical' : index === 1 ? 'high' : 'medium',
    radius_meters: zone.radius_meters + (isDamBreak ? 1800 : 900),
    status: index === 0 ? 'evacuating' : zone.status,
    is_verified: false,
  }))
  if (isDamBreak && !zones.some((zone) => zone.name === 'Downstream Dam Corridor')) {
    zones.push({
      id: `demo-${Date.now()}`,
      name: 'Downstream Dam Corridor',
      severity: 'critical',
      population: 42000,
      lat: 25.59,
      lon: 85.205,
      radius_meters: 8500,
      is_verified: false,
      status: 'immediate_evacuation',
    })
  }
  const reports = isDamBreak
    ? current.reports.map((report) => ({ ...report }))
    : current.reports
  const updated = {
    ...current,
    event_name: isDamBreak ? 'DEMONSTRATION - Kosi Barrage Dam Break' : 'DEMONSTRATION - Monsoon Surge, District West',
    severity: 'Critical',
    warning_source: 'SIMULATED / DEMONSTRATION',
    risk_score: riskScore,
    people_at_risk: isDamBreak ? 174500 : 164800,
    water_coverage: isDamBreak ? 53.8 : 54.6,
    alert_window_hours: isDamBreak ? 3.65 : current.alert_window_hours,
    zones,
    reports,
    rescue_teams: current.rescue_teams.map((team) => ({
      ...team,
      status: 'deployed',
      assigned_zone: zones[0]?.name || team.assigned_zone,
    })),
    kpis: {
      ...current.kpis,
      peopleAtRisk: isDamBreak ? 174500 : 164800,
      evacuationPercent: 67,
      alertsActive: current.kpis.alertsActive + 1,
    },
  }
  return updated
}

function bindZonePopup(feature, layer) {
  const properties = feature.properties || {}
  const popup = document.createElement('div')
  const title = document.createElement('strong')
  title.textContent = properties.name || 'Flood risk zone'
  const population = document.createElement('div')
  population.textContent = `${formatNumber(properties.population || 0)} residents`
  const severity = document.createElement('div')
  severity.textContent = `Severity: ${properties.severity || 'unknown'}`
  const status = document.createElement('div')
  status.textContent = `Response: ${properties.status || 'monitoring'}`
  const source = document.createElement('small')
  source.textContent = properties.source || 'SIMULATED / DEMONSTRATION'
  popup.append(title, population, severity, status, source)
  layer.bindPopup(popup)
}

function App() {
  const [activePage, setActivePage] = useState('landing')
  const [data, setData] = useState(fallbackData)
  const [mapData, setMapData] = useState(() => buildLocalMapData(fallbackData))
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyAction, setBusyAction] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [usingDemoData, setUsingDemoData] = useState(true)
  const [mapTilesUnavailable, setMapTilesUnavailable] = useState(false)
  const mapTileErrorCount = useRef(0)
  const [requestMessage, setRequestMessage] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashboardResponse, mapResponse, alertsResponse] = await Promise.all([
          api.get('/dashboard'),
          api.get('/map-data'),
          api.get('/alerts'),
        ])
        setData(dashboardResponse.data)
        setMapData(mapResponse.data)
        setAlerts(alertsResponse.data.alerts)
        setUsingDemoData(false)
        setErrorMessage('')
      } catch {
        setData(fallbackData)
        setMapData(buildLocalMapData(fallbackData))
        setAlerts(buildLocalAlerts(fallbackData))
        setUsingDemoData(true)
        setErrorMessage('The FloodGuard API is unavailable. Showing clearly labelled DEMO DATA; local simulation and help-request actions remain available.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const navigateTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])
  const handleMapTilesLoading = useCallback(() => {
    mapTileErrorCount.current = 0
    setMapTilesUnavailable(false)
  }, [])
  const handleMapTileError = useCallback(() => {
    mapTileErrorCount.current += 1
    setMapTilesUnavailable(true)
  }, [])
  const handleMapTileLoad = useCallback(() => {
    setMapTilesUnavailable(mapTileErrorCount.current > 0)
  }, [])

  const refreshBackendData = useCallback(async () => {
    const [dashboardResponse, mapResponse, alertsResponse] = await Promise.all([
      api.get('/dashboard'),
      api.get('/map-data'),
      api.get('/alerts'),
    ])
    setData(dashboardResponse.data)
    setMapData(mapResponse.data)
    setAlerts(alertsResponse.data.alerts)
    setUsingDemoData(false)
    return dashboardResponse.data
  }, [])

  const runSimulation = async (type) => {
    setBusyAction(type)
    setErrorMessage('')
    try {
      const endpoint = type === 'dam-break' ? '/simulation/dam-break' : '/simulation/scenario'
      const payload = type === 'dam-break'
        ? { dam_name: 'Kosi Barrage', release_volume_mcm: 35 }
        : { intensity: 'severe' }
      const response = await api.post(endpoint, payload)
      setData(response.data)
      setUsingDemoData(false)
      try {
        const [mapResponse, alertsResponse] = await Promise.all([api.get('/map-data'), api.get('/alerts')])
        setMapData(mapResponse.data)
        setAlerts(alertsResponse.data.alerts)
      } catch {
        setMapData(buildLocalMapData(response.data))
        setAlerts(buildLocalAlerts(response.data))
        setErrorMessage('The simulation was saved by the backend, but some map or alert layers could not refresh.')
      }
    } catch {
      const updated = getLocalSimulationData(data, type === 'dam-break')
      setData(updated)
      setMapData(buildLocalMapData(updated))
      setAlerts(buildLocalAlerts(updated))
      setUsingDemoData(true)
      setErrorMessage(`Backend unavailable. ${type === 'dam-break' ? 'Dam-break' : 'Flood scenario'} ran using local DEMO DATA only.`)
    } finally {
      setBusyAction('')
    }
  }

  const updateRequestStatus = async (reportId, status) => {
    setBusyAction(`request-${reportId}`)
    setErrorMessage('')
    try {
      await api.patch(`/reports/${reportId}/status`, { status })
      setData((current) => ({
        ...current,
        reports: current.reports.map((report) => report.id === reportId
          ? { ...report, status, resolved: status === 'resolved' }
          : report),
      }))
      try {
        await refreshBackendData()
      } catch {
        setErrorMessage('The request status was saved, but the dashboard could not refresh its latest data.')
      }
    } catch {
      const updated = {
        ...data,
        reports: data.reports.map((report) => report.id === reportId
          ? { ...report, status, resolved: status === 'resolved' }
          : report),
      }
      setData(updated)
      setMapData(buildLocalMapData(updated))
      setAlerts(buildLocalAlerts(updated))
      setUsingDemoData(true)
      setErrorMessage('Backend unavailable. Request status was changed in local DEMO DATA and will not persist.')
    } finally {
      setBusyAction('')
    }
  }

  const submitCitizenRequest = async (event) => {
    event.preventDefault()
    const formElement = event.currentTarget
    setRequestMessage('')
    setBusyAction('citizen-request')
    const form = new FormData(event.currentTarget)
    const payload = {
      reporter: form.get('reporter'),
      locality: form.get('locality'),
      issue_type: form.get('issue_type'),
      severity: form.get('severity'),
      description: form.get('description'),
      lat: Number(form.get('lat')) || data.map_center[0],
      lon: Number(form.get('lon')) || data.map_center[1],
    }
    try {
      const { data: response } = await api.post('/reports', payload)
      setRequestMessage(response.message)
      formElement.reset()
      try {
        await refreshBackendData()
      } catch {
        setErrorMessage('Your request was received by the backend, but the dashboard could not refresh its latest data.')
      }
    } catch {
      const localReport = {
        ...payload,
        id: `demo-${Date.now()}`,
        resolved: false,
        status: 'pending',
      }
      const updated = { ...data, reports: [localReport, ...data.reports] }
      setData(updated)
      setMapData(buildLocalMapData(updated))
      setAlerts(buildLocalAlerts(updated))
      setUsingDemoData(true)
      setRequestMessage('Request added to local DEMO DATA only; it was not sent to the operations API.')
      formElement.reset()
      setErrorMessage('Backend unavailable. Citizen requests are stored in this browser session only.')
    } finally {
      setBusyAction('')
    }
  }

  const exportReport = () => {
    const report = new Blob([JSON.stringify({ ...data, map: mapData, alerts, source: 'SIMULATED / DEMONSTRATION' }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(report)
    const link = document.createElement('a')
    link.href = url
    link.download = 'floodguard-demonstration-report.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const openCommandCenter = () => {
    setActivePage('command')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const launchLandingScenario = () => {
    setActivePage('command')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    runSimulation('scenario')
  }

  const threatBreakdown = useMemo(() => {
    const counts = { Critical: 0, High: 0, Moderate: 0, Low: 0 }
    data.zones.forEach((zone) => {
      const key = zone.severity === 'critical'
        ? 'Critical'
        : zone.severity === 'high'
          ? 'High'
          : zone.severity === 'medium'
            ? 'Moderate'
            : 'Low'
      counts[key] += 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [data.zones])
  const riskHistory = useMemo(
    () => chartHistory.map((point, index) => ({
      ...point,
      risk: Math.min(100, Math.round(data.risk_score - (chartHistory.length - index - 1) * 6)),
    })),
    [data.risk_score],
  )
  const rainfallHistory = useMemo(
    () => hydrographHistory.map((point) => ({
      ...point,
      rainfall: Math.round(point.rainfall * Math.max(0.5, data.water_coverage / 38.2)),
    })),
    [data.water_coverage],
  )
  const riverLevelHistory = useMemo(
    () => hydrographHistory.map((point) => ({
      ...point,
      river: Number((point.river * Math.max(0.7, data.risk_score / 82.4)).toFixed(1)),
    })),
    [data.risk_score],
  )
  const populationHistory = useMemo(
    () => hydrographHistory.map((point) => ({
      ...point,
      population: Math.round(point.population * (data.people_at_risk / 128450)),
    })),
    [data.people_at_risk],
  )
  const openRequests = data.reports.filter((report) => (
    (report.status || (report.resolved ? 'resolved' : 'pending')) !== 'resolved'
  ))
  const shelterCapacity = data.shelters.reduce((total, shelter) => total + shelter.capacity, 0)
  const shelterOccupancy = data.shelters.reduce((total, shelter) => total + shelter.occupancy, 0)
  const shelterOccupancyPercent = shelterCapacity
    ? Math.round((shelterOccupancy / shelterCapacity) * 100)
    : 0

  if (loading) {
    return (
      <div className="loading-shell">
        <div>
          <div className="loading-spinner" />
          <p>Loading FloodGuard demonstration data…</p>
        </div>
      </div>
    )
  }

  if (activePage === 'landing') {
    return (
      <main className="landing-page">
        <div className="landing-ambient ambient-one" />
        <div className="landing-ambient ambient-two" />
        <header className="landing-nav">
          <button type="button" className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="landing-brand-mark"><Waves size={22} /></span>
            <span>FLOODGUARD <strong>AI</strong></span>
          </button>
          <div className="landing-nav-meta">
            <span className="demo-mode-pill"><span /> SIMULATION / DEMONSTRATION MODE</span>
            <button type="button" className="nav-open-button" onClick={openCommandCenter}>
              Open Command Center <ArrowRight size={16} />
            </button>
          </div>
        </header>

        <section className="landing-hero">
          <div className="landing-copy">
            <div className="landing-kicker"><span className="kicker-line" /> FLOODGUARD AI · INTELLIGENCE BEFORE IMPACT</div>
            <h1>When the water rises,<br /><span>every second</span> matters.</h1>
            <p className="landing-subtitle">
              AI-Powered Flood Prediction, Inundation Mapping, Early Evacuation &amp; Rescue Coordination
            </p>
            <p className="landing-description">
              One operational picture to anticipate flood risk, protect vulnerable communities, and coordinate a faster response.
            </p>
            <div className="landing-actions">
              <button type="button" className="landing-primary-button" onClick={openCommandCenter}>
                Open Command Center <ArrowRight size={17} />
              </button>
              <button type="button" className="landing-secondary-button" disabled={Boolean(busyAction)} onClick={launchLandingScenario}>
                <Play size={15} /> {busyAction === 'scenario' ? 'Launching scenario…' : 'Launch Demo Scenario'}
              </button>
            </div>
            <div className="landing-trust-line">
              <span><ShieldCheck size={15} /> Built for resilient communities</span>
              <span className="trust-separator" />
              <span><Radio size={15} /> Decision support, not a dispatch service</span>
            </div>
          </div>

          <div className="landing-visual" aria-label="Demonstration flood-risk visualization">
            <div className="visual-topline">
              <span><span className="live-pulse" /> PATNA · BIHAR</span>
              <span className="visual-source">DEMO FEED</span>
            </div>
            <div className="visual-map">
              <div className="map-grid-lines" />
              <svg className="river-art" viewBox="0 0 650 430" role="img" aria-label="Illustrative river and flood-risk areas">
                <path className="river-bank" d="M-30 325 C80 260 100 350 205 276 S330 200 384 238 S498 300 680 168" />
                <path className="river-path" d="M-30 325 C80 260 100 350 205 276 S330 200 384 238 S498 300 680 168" />
                <path className="river-highlight" d="M-30 325 C80 260 100 350 205 276 S330 200 384 238 S498 300 680 168" />
                <path className="district-road" d="M20 110 C130 145 140 185 236 172 S400 130 630 352" />
                <path className="district-road road-two" d="M80 408 C164 323 220 332 280 280 S404 151 524 32" />
                <path className="risk-zone zone-one" d="M78 194 C92 146 149 130 190 150 C226 168 238 215 219 251 C195 294 141 290 105 267 C76 248 67 222 78 194Z" />
                <path className="risk-zone zone-two" d="M367 97 C398 69 451 75 479 103 C510 134 501 177 474 198 C446 219 397 209 375 184 C350 156 345 119 367 97Z" />
                <path className="risk-zone zone-three" d="M404 284 C424 254 466 249 491 269 C522 294 509 331 485 350 C458 370 421 362 402 339 C387 320 390 302 404 284Z" />
                <path className="safe-route-art" d="M124 225 C189 214 241 215 292 244 S382 298 463 309" />
                <g className="map-pin pin-a"><circle r="15" /><circle className="pin-core" r="5" /></g>
                <g className="map-pin pin-b"><circle r="13" /><circle className="pin-core" r="4" /></g>
                <g className="map-pin pin-c"><circle r="12" /><circle className="pin-core" r="4" /></g>
                <g className="map-pin pin-d"><circle r="11" /><circle className="pin-core" r="3.5" /></g>
                <text x="40" y="60">NORTH RIVER BELT</text>
                <text x="445" y="230">OLD TOWN</text>
                <text x="247" y="388">EVACUATION ROUTE A</text>
              </svg>
              <div className="map-coordinate">25.618° N&nbsp;&nbsp; 85.156° E</div>
              <div className="map-scale"><span /> 2 km</div>
              <div className="map-float-card">
                <div className="float-card-icon"><AlertTriangle size={16} /></div>
                <div><strong>High flood risk</strong><small>North River Belt · 42,000 residents</small></div>
                <ArrowDownRight size={16} className="float-trend" />
              </div>
            </div>
            <div className="visual-footer">
              <div><span className="visual-stat-label">RISK INDEX</span><strong>{data.risk_score}<small>/100</small></strong></div>
              <div><span className="visual-stat-label">AT-RISK POPULATION</span><strong>{formatNumber(data.people_at_risk)}</strong></div>
              <div><span className="visual-stat-label">LEAD TIME</span><strong>{data.alert_window_hours}<small> hrs</small></strong></div>
            </div>
          </div>
        </section>

        <section className="five-questions">
          <div className="questions-heading">
            <div>
              <p className="landing-kicker"><span className="kicker-line" /> FROM FORECAST TO FIELD RESPONSE</p>
              <h2>One platform. Five critical answers.</h2>
            </div>
            <span>Flood response starts with clarity.</span>
          </div>
          <div className="question-grid">
            {[
              { icon: Crosshair, number: '01', question: 'WHERE', detail: 'will flooding happen?', tone: 'blue' },
              { icon: Clock3, number: '02', question: 'WHEN', detail: 'could it happen?', tone: 'cyan' },
              { icon: Users, number: '03', question: 'WHO', detail: 'is at risk?', tone: 'amber' },
              { icon: Navigation, number: '04', question: 'WHERE', detail: 'should people go?', tone: 'green' },
              { icon: Siren, number: '05', question: 'HOW', detail: 'should rescue teams respond?', tone: 'rose' },
            ].map(({ icon: Icon, number, question, detail, tone }) => (
              <article className={`question-card tone-${tone}`} key={number}>
                <div className="question-card-top"><span>{number}</span><Icon size={19} /></div>
                <h3>{question}</h3>
                <p>{detail}</p>
                <div className="question-card-line" />
              </article>
            ))}
          </div>
          <div className="landing-bottom-cta">
            <span><Layers3 size={17} /> Risk intelligence, mapped to action.</span>
            <button type="button" onClick={openCommandCenter}>Explore the command center <ArrowRight size={16} /></button>
          </div>
        </section>
        <footer className="landing-footer">
          <span>FLOODGUARD AI <span>·</span> SMART INDIA HACKATHON DEMONSTRATION</span>
          <span>SIMULATED DATA · NOT FOR EMERGENCY DISPATCH</span>
        </footer>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 command-page">
      <div className="dashboard-shell">
        <aside className="sidebar-panel">
          <button type="button" className="logo-block logo-home-button" onClick={() => setActivePage('landing')} aria-label="Return to FloodGuard AI overview">
            <div className="logo-mark"><Waves size={21} /></div>
            <div>
              <p className="eyebrow">DISASTER COMMAND</p>
              <h2>FLOODGUARD AI</h2>
            </div>
          </button>

          <nav className="nav-list" aria-label="Dashboard sections">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="nav-item"
                onClick={() => navigateTo(item.id)}
              >
                <span className="dot" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="status-box">
            <p className="status-label"><span className="status-indicator status-indicator-animated" /> Emergency status</p>
            <div className="status-row">
              <span>{data.severity.toUpperCase()} EVENT ACTIVE</span>
            </div>
            <p className="subtle-text">Monitoring {data.district}, {data.state}</p>
            <span className="sidebar-demo-tag">SIMULATION MODE</span>
          </div>
        </aside>

        <main className="main-panel">
          <header className="topbar">
            <div className="topbar-left">
              <button type="button" className="back-to-overview" onClick={() => setActivePage('landing')}>
                <ArrowLeft size={15} /> Overview
              </button>
              <div className="location-pill">
                <MapPin size={16} />
                <span>{data.district}, {data.state}</span>
              </div>
              <div className="status-pill warning">
                <AlertTriangle size={16} />
                {data.severity} flood alert
              </div>
            </div>
            <div className="topbar-right">
              <button className="icon-button" type="button" aria-label="View alerts" onClick={() => navigateTo('alerts')}>
                <BellRing size={18} />
              </button>
              <div className="profile-chip">
                <div className="avatar"><Radio size={16} /></div>
                <div>
                  <strong>District control</strong>
                  <small>Simulation operator</small>
                </div>
              </div>
            </div>
          </header>

          {errorMessage && (
            <div className="message-banner warning-banner" role="status">
              <AlertTriangle size={18} />
              <span>{errorMessage}</span>
              <button type="button" className="banner-dismiss" onClick={() => setErrorMessage('')} aria-label="Dismiss message">×</button>
            </div>
          )}

          <div className="command-title-row">
            <div>
              <p className="eyebrow text-sky-300">FLOOD RESPONSE · COMMAND CENTER</p>
              <h1>Situation overview</h1>
              <p className="command-subtitle">{data.event_name} <span>·</span> {data.district}, {data.state}</p>
            </div>
            <div className="command-mode-chip"><span className="live-pulse" /> SIMULATION / DEMONSTRATION MODE</div>
          </div>

          <button type="button" className="live-alert-banner" onClick={() => navigateTo('alerts')}>
            <span className="live-alert-icon"><Siren size={20} /></span>
            <span className="live-alert-copy">
              <strong>ACTIVE FLOOD ALERT <span>·</span> {data.severity.toUpperCase()}</strong>
              <small>{data.zones.filter((zone) => ['critical', 'high'].includes(zone.severity)).length} priority zones · {formatNumber(data.people_at_risk)} people at risk · {data.alert_window_hours} hours estimated lead time</small>
            </span>
            <span className="live-alert-action">Review alerts <ArrowRight size={15} /></span>
          </button>

          <section className="command-action-row" id="dashboard">
            <div className="command-event-meta">
              <span className="event-meta-icon"><MapPin size={15} /></span>
              <span>Active scenario <strong>{data.event_name}</strong></span>
            </div>
            <div className="hero-actions">
              <button type="button" className="primary-button" disabled={Boolean(busyAction)} onClick={() => runSimulation('scenario')}>
                <Play size={15} /> {busyAction === 'scenario' ? 'Launching…' : 'Launch Demo Scenario'}
              </button>
              <button type="button" className="ghost-button" onClick={exportReport}>Export report</button>
            </div>
          </section>

          <p className="demo-ribbon">{usingDemoData ? 'DEMO DATA · API unavailable or local fallback' : 'SIMULATED / DEMONSTRATION · backend connected'}</p>

          <section className="kpi-grid" aria-label="Backend flood risk indicators">
            <div className="kpi-card">
              <div className="kpi-icon danger"><Users size={18} /></div>
              <div>
                <p>People at risk</p>
                <h3>{formatNumber(data.people_at_risk)}</h3>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon warning"><ShieldCheck size={18} /></div>
              <div>
                <p>Shelters ready</p>
                <h3>{data.kpis.sheltersReady}</h3>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon info"><Route size={18} /></div>
              <div>
                <p>Evacuation coverage</p>
                <h3>{data.kpis.evacuationPercent}%</h3>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon secondary"><CloudRain size={18} /></div>
              <div>
                <p>Active alerts</p>
                <h3>{data.kpis.alertsActive}</h3>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon risk"><Gauge size={18} /></div>
              <div>
                <p>Flood risk index</p>
                <h3>{data.risk_score}<small className="kpi-suffix">/100</small></h3>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon requests"><Siren size={18} /></div>
              <div>
                <p>Open rescue requests</p>
                <h3>{openRequests.length}</h3>
              </div>
            </div>
          </section>

          <section className="analytics-grid" aria-label="Flood forecast charts">
            <article className="panel analytics-panel">
              <div className="panel-header">
                <div><p className="eyebrow text-sky-300"><CloudRain size={13} /> RAINFALL FORECAST</p><h3>Rainfall intensity</h3></div>
                <span className="chart-unit">mm / 2 hrs</span>
              </div>
              <div className="analytics-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rainfallHistory}>
                    <defs><linearGradient id="rainFill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.36} /><stop offset="95%" stopColor="#38bdf8" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#243248" vertical={false} />
                    <XAxis dataKey="name" stroke="#8192aa" tickLine={false} axisLine={false} />
                    <YAxis stroke="#8192aa" tickLine={false} axisLine={false} width={32} />
                    <Tooltip contentStyle={{ background: '#101b2b', border: '1px solid #293951', borderRadius: 10 }} />
                    <Area type="monotone" dataKey="rainfall" stroke="#38bdf8" strokeWidth={2.5} fill="url(#rainFill)" name="Rainfall" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-footnote"><span className="chart-dot rainfall-dot" /> SIMULATED / DEMONSTRATION · next 12 hours</div>
            </article>

            <article className="panel analytics-panel">
              <div className="panel-header">
                <div><p className="eyebrow text-sky-300"><Waves size={13} /> RIVER MONITORING</p><h3>River level trend</h3></div>
                <span className="chart-unit">metres</span>
              </div>
              <div className="analytics-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riverLevelHistory}>
                    <defs><linearGradient id="riverFill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.32} /><stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#243248" vertical={false} />
                    <XAxis dataKey="name" stroke="#8192aa" tickLine={false} axisLine={false} />
                    <YAxis stroke="#8192aa" tickLine={false} axisLine={false} width={32} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip contentStyle={{ background: '#101b2b', border: '1px solid #293951', borderRadius: 10 }} />
                    <Area type="monotone" dataKey="river" stroke="#2dd4bf" strokeWidth={2.5} fill="url(#riverFill)" name="River level" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-footnote"><span className="chart-dot river-dot" /> SIMULATED / DEMONSTRATION · gauge estimate</div>
            </article>

            <article className="panel analytics-panel">
              <div className="panel-header">
                <div><p className="eyebrow text-sky-300"><Users size={13} /> POPULATION EXPOSURE</p><h3>People in risk zones</h3></div>
                <span className="chart-unit">thousands</span>
              </div>
              <div className="analytics-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={populationHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#243248" vertical={false} />
                    <XAxis dataKey="name" stroke="#8192aa" tickLine={false} axisLine={false} />
                    <YAxis stroke="#8192aa" tickLine={false} axisLine={false} width={32} />
                    <Tooltip contentStyle={{ background: '#101b2b', border: '1px solid #293951', borderRadius: 10 }} />
                    <Bar dataKey="population" fill="#f59e0b" radius={[5, 5, 0, 0]} name="Population (000s)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-footnote"><span className="chart-dot population-dot" /> SIMULATED / DEMONSTRATION · exposure projection</div>
            </article>
          </section>

          <section className="readiness-grid" aria-label="Response readiness">
            <article className="panel readiness-panel" id="evacuation">
              <div className="panel-header">
                <div><p className="eyebrow text-sky-300"><Navigation size={13} /> EVACUATION PROGRESS</p><h3>Community movement</h3></div>
                <strong className="readiness-value">{data.kpis.evacuationPercent}%</strong>
              </div>
              <div className="progress-track"><span style={{ width: `${data.kpis.evacuationPercent}%` }} /></div>
              <div className="readiness-meta"><span>Evacuation coverage</span><span>{formatNumber(Math.round(data.people_at_risk * data.kpis.evacuationPercent / 100))} of {formatNumber(data.people_at_risk)} people</span></div>
              <div className="readiness-note"><CheckCircle2 size={15} /> Priority routes coordinated with field teams</div>
            </article>

            <article className="panel readiness-panel" id="shelters">
              <div className="panel-header">
                <div><p className="eyebrow text-sky-300"><Building2 size={13} /> SHELTER CAPACITY</p><h3>Safe-haven occupancy</h3></div>
                <strong className="readiness-value">{data.kpis.sheltersReady}<small> ready</small></strong>
              </div>
              <div className="progress-track shelter-progress"><span style={{ width: `${shelterOccupancyPercent}%` }} /></div>
              <div className="readiness-meta"><span>{formatNumber(shelterOccupancy)} occupied</span><span>{formatNumber(Math.max(0, shelterCapacity - shelterOccupancy))} spaces available</span></div>
              <div className="readiness-note"><ShieldCheck size={15} /> {formatNumber(shelterCapacity)} total capacity · {shelterOccupancyPercent}% occupied</div>
            </article>

            <article className="panel readiness-panel">
              <div className="panel-header">
                <div><p className="eyebrow text-sky-300"><Siren size={13} /> RESCUE DESK</p><h3>Request status</h3></div>
                <strong className="readiness-value">{openRequests.length}<small> open</small></strong>
              </div>
              <div className="request-stat-row">
                <span><i className="request-dot-small pending-dot" /> Pending <strong>{openRequests.filter((report) => (report.status || 'pending') === 'pending').length}</strong></span>
                <span><i className="request-dot-small active-dot" /> Assigned / active <strong>{openRequests.filter((report) => ['assigned', 'in_progress'].includes(report.status)).length}</strong></span>
                <span><i className="request-dot-small resolved-dot" /> Resolved <strong>{data.reports.length - openRequests.length}</strong></span>
              </div>
              <button type="button" className="readiness-link" onClick={() => navigateTo('rescue-operations')}>Open rescue desk <ArrowRight size={14} /></button>
            </article>
          </section>

          <section className="content-grid top-grid" id="flood-map">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow text-sky-300">LIVE RISK MAP</p>
                  <h3>Predicted inundation footprint</h3>
                </div>
                <div className="legend-row">
                  <span className="legend-badge simulated">Demo flood polygons</span>
                  <span className="legend-badge verified">Facilities & route</span>
                </div>
              </div>

              <div className="map-actions">
                <span>Map layers · {mapData.source || 'SIMULATED / DEMONSTRATION'}</span>
                <button type="button" className="primary-button small" disabled={Boolean(busyAction)} onClick={() => runSimulation('scenario')}>
                  {busyAction === 'scenario' ? 'Running scenario…' : 'Launch Demo Scenario'}
                </button>
                <button type="button" className="ghost-button small" disabled={Boolean(busyAction)} onClick={() => runSimulation('dam-break')}>
                  {busyAction === 'dam-break' ? 'Simulating…' : 'Run Dam Break Simulator'}
                </button>
              </div>

              <div className="map-wrap">
                <MapContainer center={data.map_center} zoom={12} scrollWheelZoom className="leaflet-map">
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    eventHandlers={{
                      loading: handleMapTilesLoading,
                      tileerror: handleMapTileError,
                      load: handleMapTileLoad,
                    }}
                  />

                  <GeoJSON
                    key={`${data.event_name}-${data.risk_score}-${mapData.zones_geojson?.features?.length || 0}`}
                    data={mapData.zones_geojson}
                    style={(feature) => {
                      const color = zoneColors[feature?.properties?.severity] || '#38bdf8'
                      return { color, fillColor: color, fillOpacity: 0.32, weight: 2 }
                    }}
                    onEachFeature={bindZonePopup}
                  />

                  {data.shelters.map((shelter) => (
                    <CircleMarker
                      key={shelter.id}
                      center={[shelter.lat, shelter.lon]}
                      radius={8}
                      pathOptions={{
                        color: '#34d399',
                        fillColor: '#34d399',
                        fillOpacity: 0.9,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div>
                          <strong>{shelter.name} · {shelter.category}</strong>
                          <div>Capacity: {shelter.capacity}</div>
                          <div>Status: {shelter.status}</div>
                          <small>SIMULATED / DEMONSTRATION</small>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                  {(mapData.facilities || []).map((facility) => (
                    <CircleMarker
                      key={facility.id}
                      center={[facility.lat, facility.lon]}
                      radius={facility.category === 'dam' ? 9 : 7}
                      pathOptions={{
                        color: facility.category === 'hospital' ? '#c084fc' : facility.category === 'dam' ? '#f97316' : '#60a5fa',
                        fillColor: facility.category === 'hospital' ? '#c084fc' : facility.category === 'dam' ? '#f97316' : '#60a5fa',
                        fillOpacity: 0.95,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div>
                          <strong>{facility.name}</strong>
                          <div>{facility.category} · {facility.status}</div>
                          <small>{facility.source}</small>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                  {(mapData.rescue_requests || []).map((request) => (
                    <CircleMarker
                      key={`request-${request.id}`}
                      center={[request.lat, request.lon]}
                      radius={7}
                      pathOptions={{ color: '#fff', fillColor: '#ef4444', fillOpacity: 0.95, weight: 2 }}
                    >
                      <Popup>
                        <div>
                          <strong>Rescue request · {request.locality}</strong>
                          <div>{request.description}</div>
                          <div>Status: {request.status || (request.resolved ? 'resolved' : 'pending')}</div>
                          <small>SIMULATED / DEMONSTRATION</small>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                  {(mapData.routes || []).map((safeRoute) => (
                    <Polyline
                      key={safeRoute.id}
                      positions={safeRoute.coordinates}
                      pathOptions={{ color: routeColors[safeRoute.status] || '#60a5fa', weight: 5, opacity: 0.85 }}
                    >
                      <Popup>
                        <div>
                          <strong>{safeRoute.name}</strong>
                          <div>{safeRoute.distance_km} km · {safeRoute.status}</div>
                          <small>{safeRoute.source}</small>
                        </div>
                      </Popup>
                    </Polyline>
                  ))}
                </MapContainer>
                {mapTilesUnavailable && (
                  <div className="map-fallback-label" role="status">
                    Basemap unavailable · showing SIMULATED / DEMONSTRATION map layers
                  </div>
                )}
              </div>
              <div className="map-legend">
                <span><i className="legend-dot flood-dot" />Flood zone</span>
                <span><i className="legend-dot shelter-dot" />Shelter</span>
                <span><i className="legend-dot school-dot" />School</span>
                <span><i className="legend-dot hospital-dot" />Hospital</span>
                <span><i className="legend-dot dam-dot" />Dam</span>
                <span><i className="legend-dot request-dot" />Rescue request</span>
                <span><i className="legend-line" />Safe route</span>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow text-sky-300">EVACUATION PRIORITY</p>
                  <h3>Recommended action order</h3>
                </div>
              </div>

              <div className="stack-list">
                {data.evacuation_priority.map((item, index) => (
                  <div className="priority-item" key={item}>
                    <span className="priority-number">{index + 1}</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>

              <div className="mini-chart">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={threatBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {threatBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.name === 'Critical' ? '#ef4444' : entry.name === 'High' ? '#f97316' : entry.name === 'Moderate' ? '#fbbf24' : '#34d399'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="content-grid lower-grid">
            <div className="panel" id="risk-analysis">
              <div className="panel-header">
                <div>
                  <p className="eyebrow text-sky-300">RISK ANALYSIS</p>
                  <h3>Forecast trend</h3>
                </div>
              </div>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={riskHistory}>
                    <defs>
                      <linearGradient id="riskFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="risk" stroke="#38bdf8" fill="url(#riskFill)" strokeWidth={3} name="Risk index" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow text-sky-300">RESCUE OPERATIONS</p>
                  <h3>Response teams</h3>
                </div>
              </div>
              <div className="team-list">
                {data.rescue_teams.map((team) => (
                  <div className="team-card" key={team.id}>
                    <div className="team-title-row">
                      <strong>{team.name}</strong>
                      <span className={`team-status ${team.status}`}>{team.status}</span>
                    </div>
                    <p>Leader: {team.leader}</p>
                    <p>Specialty: {team.specialty}</p>
                    <p>Assigned zone: {team.assigned_zone}</p>
                  </div>
                ))}
              </div>
              <h4 className="subsection-title">Citizen rescue requests</h4>
              <div className="report-list">
                {data.reports.length === 0 && <p className="subtle-text">No rescue requests have been received.</p>}
                {data.reports.map((report) => (
                  <div className="report-item" key={report.id}>
                    <div className="report-head">
                      <strong>{report.locality} · {report.severity}</strong>
                      <span className={`request-status status-${report.status || (report.resolved ? 'resolved' : 'pending')}`}>
                        {(report.status || (report.resolved ? 'resolved' : 'pending')).replace('_', ' ')}
                      </span>
                    </div>
                    <p>{report.description}</p>
                    <div className="request-controls">
                      <small>{report.reporter} · {report.issue_type} · SIMULATED / DEMONSTRATION</small>
                      <label>
                        Update status
                        <select
                          aria-label={`Update rescue request for ${report.locality}`}
                          value={report.status || (report.resolved ? 'resolved' : 'pending')}
                          disabled={busyAction === `request-${report.id}`}
                          onChange={(event) => updateRequestStatus(report.id, event.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="content-grid bottom-grid">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow text-sky-300">SHELTER NETWORK</p>
                  <h3>Safe locations</h3>
                </div>
                <button type="button" className="ghost-button small" onClick={() => navigateTo('safe-route')}>View routes</button>
              </div>
              <div className="list-grid">
                {data.shelters.map((shelter) => (
                  <div className="info-card" key={shelter.id}>
                    <div className="info-card-header">
                      <div className="info-icon orange"><Building2 size={18} /></div>
                      <span className="status-badge open">{shelter.status}</span>
                    </div>
                    <h4>{shelter.name}</h4>
                    <p>{shelter.category}</p>
                    <div className="meta-row">
                      <span>Capacity {shelter.capacity}</span>
                      <span>{shelter.accessible ? 'Accessible' : 'Limited access'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow text-sky-300">CITIZEN REPORTS</p>
                  <h3>Field updates</h3>
                </div>
              </div>
              <div className="report-list">
                {data.reports.map((report) => (
                  <div className="report-item" key={report.id}>
                    <div className="report-head">
                      <strong>{report.locality}</strong>
                      <span className="report-severity">{report.severity}</span>
                    </div>
                    <p>{report.description}</p>
                    <small>{report.reporter} • {report.issue_type}</small>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel workflow-panel" id="safe-route">
            <div className="panel-header">
              <div>
                <p className="eyebrow text-sky-300">SAFE ROUTE</p>
                <h3>Evacuation routes to open shelters</h3>
              </div>
              <span className="legend-badge simulated">SIMULATED / DEMONSTRATION</span>
            </div>
            <div className="route-cards">
              {(mapData.routes || []).map((safeRoute) => (
                <article className="route-card" key={safeRoute.id}>
                  <div className="route-card-head">
                    <Route size={18} />
                    <strong>{safeRoute.name}</strong>
                  </div>
                  <p>{safeRoute.distance_km} km · <span className={`route-status ${safeRoute.status === 'open' ? 'route-open' : 'route-blocked'}`}>{safeRoute.status}</span></p>
                  <small>{safeRoute.source}</small>
                </article>
              ))}
            </div>
            <p className="subtle-text">Route lines are also shown on the flood map. Verify road conditions with field teams before dispatch.</p>
          </section>

          <section className="content-grid workflow-grid">
            <div className="panel" id="citizen-help">
              <div className="panel-header">
                <div>
                  <p className="eyebrow text-sky-300">CITIZEN REQUEST HELP</p>
                  <h3>Send a rescue request</h3>
                </div>
              </div>
              {requestMessage && <p className="message-banner success-banner" role="status">{requestMessage}</p>}
              <form className="help-form" onSubmit={submitCitizenRequest}>
                <label>
                  Your name
                  <input name="reporter" minLength="2" maxLength="120" placeholder="Name or anonymous" defaultValue="Anonymous citizen" required />
                </label>
                <label>
                  Locality
                  <input name="locality" minLength="2" maxLength="120" placeholder="Area / neighborhood" required />
                </label>
                <label>
                  Issue
                  <select name="issue_type" defaultValue="rescue_request">
                    <option value="rescue_request">Need rescue</option>
                    <option value="medical_emergency">Medical emergency</option>
                    <option value="road_blocked">Road blocked</option>
                    <option value="water_level_rising">Water level rising</option>
                  </select>
                </label>
                <label>
                  Urgency
                  <select name="severity" defaultValue="high">
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
                <label>
                  Latitude
                  <input name="lat" type="number" step="any" min="-90" max="90" defaultValue={data.map_center[0]} />
                </label>
                <label>
                  Longitude
                  <input name="lon" type="number" step="any" min="-180" max="180" defaultValue={data.map_center[1]} />
                </label>
                <label className="form-full">
                  What help is needed?
                  <textarea name="description" minLength="5" maxLength="2000" rows="3" placeholder="Describe the situation and number of people needing help" required />
                </label>
                <button type="submit" className="primary-button form-full" disabled={busyAction === 'citizen-request'}>
                  {busyAction === 'citizen-request' ? 'Sending request…' : 'REQUEST HELP'}
                </button>
              </form>
              <p className="subtle-text">Demonstration only. This prototype does not contact real emergency services.</p>
            </div>

            <div className="panel" id="alerts">
              <div className="panel-header">
                <div>
                  <p className="eyebrow text-sky-300">ALERTS</p>
                  <h3>Active flood and rescue alerts</h3>
                </div>
                <span className="status-badge open">{alerts.length} active</span>
              </div>
              <div className="alert-list">
                {alerts.length === 0 && <p className="subtle-text">No active alerts. Run a demonstration scenario to populate alerts.</p>}
                {alerts.map((alert) => (
                  <article className="alert-card" key={alert.id}>
                    <div className={`alert-icon severity-${alert.severity}`}><BellRing size={17} /></div>
                    <div>
                      <strong>{alert.title}</strong>
                      <p>{alert.description}</p>
                      <small>{alert.source || 'SIMULATED / DEMONSTRATION'}</small>
                    </div>
                  </article>
                ))}
              </div>
              <button type="button" className="ghost-button" disabled={Boolean(busyAction)} onClick={() => runSimulation('scenario')}>
                Trigger demonstration alert
              </button>
            </div>
          </section>

          <footer className="bottom-bar">
            <div className="footer-block">
              <Activity size={16} />
              <span>Water coverage: {data.water_coverage}%</span>
            </div>
            <div className="footer-block">
              <Gauge size={16} />
              <span>Risk score: {data.risk_score}</span>
            </div>
            <div className="footer-block">
              <Hospital size={16} />
              <span>Alert window: {data.alert_window_hours} hrs</span>
            </div>
            <div className="footer-block">
              <Search size={16} />
              <span>{data.warning_source}</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default App
