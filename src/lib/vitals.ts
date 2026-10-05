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

  // In production, you can send metrics to an analytics service
  // Example: send to your analytics endpoint
  // if (process.env.NODE_ENV === 'production') {
  //   const body = {
  //     name: metric.name,
  //     value: metric.value,
  //     rating: metric.rating,
  //     delta: metric.delta,
  //     id: metric.id,
  //     url: window.location.href,
  //   }
  //   // Send to your analytics endpoint
  //   navigator.sendBeacon('/api/analytics/vitals', JSON.stringify(body))
  // }
}
