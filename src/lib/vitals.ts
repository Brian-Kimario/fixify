import { CLSMetric, FCPMetric, INPMetric, LCPMetric, TTFBMetric } from 'web-vitals'

export type WebVitalsMetric = LCPMetric | INPMetric | CLSMetric | FCPMetric | TTFBMetric

export function reportWebVitals(metric: WebVitalsMetric) {
  // In development, log to console for visibility
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', {
      name: metric.name,
      value: metric.value.toFixed(2),
      rating: metric.rating,
      delta: metric.delta?.toFixed(2),
    })
  }

  // In production, send metrics to an analytics service
  // This implementation uses the sendBeacon API for reliable delivery
  // even during page unload
  if (process.env.NODE_ENV === 'production') {
    try {
      const body = {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: new Date().toISOString(),
      }
      
      // TODO: Replace '/api/analytics/vitals' with your actual analytics endpoint
      // Ensure the endpoint is configured to accept POST requests with JSON payload
      // Consider implementing analytics collection via your observability platform
      // (e.g., Vercel Analytics, Sentry, Datadog, etc.)
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/vitals', JSON.stringify(body))
      }
    } catch (error) {
      // Silently fail to avoid disrupting user experience
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to report web vital:', error)
      }
    }
  }
}
