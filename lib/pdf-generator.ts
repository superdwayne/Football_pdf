import "server-only"
import React from "react"
import type { ProcessedPlayerData } from "@/lib/data-processor"

// Dynamic import to avoid Next.js build issues
async function getReactDOMServer() {
  return await import("react-dom/server")
}

async function getPlayerReport() {
  return await import("@/components/pdf/player-report")
}

// Launch a Chromium browser suitable for both local dev and Vercel serverless
async function launchBrowser() {
  const isVercel = !!process.env.VERCEL || !!process.env.AWS_REGION

  if (isVercel) {
    try {
      console.log("🔧 Vercel environment detected, using @sparticuz/chromium")

      const chromium = await import("@sparticuz/chromium")
      const puppeteer = await import("puppeteer-core")

      const chromiumInstance: any = (chromium as any).default || chromium

      console.log("📦 Chromium instance type:", typeof chromiumInstance)

      const executablePath = await chromiumInstance.executablePath()
      console.log("✅ Chromium executable path:", executablePath)

      const args = chromiumInstance.args

      console.log("🚀 Launching Puppeteer with Chromium...")
      console.log("   Executable:", executablePath)
      console.log("   Args count:", Array.isArray(args) ? args.length : "unknown")

      const browser = await puppeteer.default.launch({
        args,
        defaultViewport: chromiumInstance.defaultViewport ?? { width: 1920, height: 1080 },
        executablePath,
        headless: chromiumInstance.headless ?? true,
        timeout: 60000,
      })

      console.log("✅ Browser launched successfully!")
      return browser
    } catch (error) {
      console.error("❌ Failed to launch Chromium on Vercel:", error)
      console.error("Error type:", (error as any)?.constructor?.name)
      console.error("Error details:", error instanceof Error ? error.stack : String(error))

      throw new Error(`Failed to launch browser: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const { default: puppeteer } = await import("puppeteer")
  return await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--disable-web-security",
    ],
    timeout: 30000, // 30 second timeout
  })
}

export async function generatePDF(data: ProcessedPlayerData): Promise<Buffer> {
  let browser

  try {
    console.log("Starting PDF generation...")
    
    // Launch browser with better error handling
    console.log("Launching browser for PDF generation...")
    browser = await launchBrowser()

    console.log("Browser launched successfully")
    const page = await browser.newPage()

    // Use a high-DPI viewport so charts render sharply
    await page.setViewport({
      width: 1200,
      height: 1697, // roughly A4 at 96dpi
      deviceScaleFactor: 2,
    })

    // Set a reasonable timeout for page operations
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(30000)

    // Dynamically import React DOM Server and PlayerReport component
    console.log("Importing React DOM Server...")
    const { renderToStaticMarkup } = await getReactDOMServer()
    console.log("Importing PlayerReport component...")
    const { PlayerReport } = await getPlayerReport()

    // Render React component to HTML
    console.log("Rendering React component to HTML...")
    const htmlContent = renderToStaticMarkup(React.createElement(PlayerReport, { data }))
    console.log("HTML content generated, length:", htmlContent.length)
    
    // Note: HTML content from React should already be properly encoded
    // We'll sanitize it only if encoding errors occur
    const sanitizedHtmlContent = htmlContent

    // Safely stringify chart data for Chart.js
    const chartDataJson = JSON.stringify(data.chartData || {}, (key, value) => {
      if (typeof value === "string") {
        return value
      }
      return value
    })
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029")
      .replace(/[\u0100-\uFFFF]/g, (match) => {
        return "\\u" + ("0000" + match.charCodeAt(0).toString(16)).slice(-4)
      })

    // Create full HTML document with Tailwind CSS and Chart.js
    const fullHTML = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Player Report</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: Arial, sans-serif;
            }
          </style>
        </head>
        <body>
          ${sanitizedHtmlContent}
          <script>
            (function() {
              const chartData = ${chartDataJson};

              // Radar Chart
              if (chartData.radarChartMetrics && Object.keys(chartData.radarChartMetrics).length > 0) {
                const radarCtx = document.getElementById('radarChart');
                if (radarCtx) {
                  const radarMetrics = chartData.radarChartMetrics;
                  const resolveMetric = (...keys) => {
                    for (const key of keys) {
                      const val = radarMetrics[key]
                      if (val !== undefined && val !== null) {
                        const numeric = Number(val)
                        if (!Number.isNaN(numeric)) return numeric
                      }
                    }
                    return 0
                  }

                  new Chart(radarCtx, {
                    type: 'radar',
                    data: {
                      labels: ['Passes', 'Chances Created', 'Shots', 'Touches', 'Ball Recovery', 'Aerial Duels', 'Defensive Actions', 'Possession Regains', 'Dribbles'],
                      datasets: [{
                        label: 'Performance',
                        data: [
                          resolveMetric('Passes'),
                          resolveMetric('ChancesCreated', 'Chances Created'),
                          resolveMetric('Shots'),
                          resolveMetric('Touches'),
                          resolveMetric('BallRecovery', 'Ball Recovery'),
                          resolveMetric('AerialDuels', 'Aerial Duels'),
                          resolveMetric('DefensiveActions', 'Defensive Actions'),
                          resolveMetric('PossessionRegains', 'Possession Regains'),
                          resolveMetric('Dribbles'),
                        ],
                        backgroundColor: 'rgba(214, 177, 106, 0.32)',
                        borderColor: 'rgba(111, 90, 55, 0.9)',
                        borderWidth: 1.8,
                        pointBackgroundColor: '#f8d59a',
                        pointBorderColor: '#6d593a',
                        pointHoverBackgroundColor: '#6d593a',
                        pointHoverBorderColor: '#f8d59a'
                      }]
                    },
                    options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      layout: {
                        padding: 16,
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false },
                      },
                      scales: {
                        r: {
                          beginAtZero: true,
                          suggestedMax: 100,
                          ticks: {
                            stepSize: 20,
                            color: '#7c6a48',
                            backdropColor: 'rgba(0,0,0,0)',
                            showLabelBackdrop: false,
                            font: {
                              size: 9,
                              family: 'system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif',
                            },
                          },
                          grid: {
                            color: 'rgba(199, 170, 121, 0.65)',
                            lineWidth: 0.7,
                          },
                          angleLines: {
                            color: 'rgba(199, 170, 121, 0.85)',
                            lineWidth: 0.7,
                          },
                          pointLabels: {
                            color: '#3b3a30',
                            font: {
                              size: 11,
                              family: 'system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif',
                            },
                          },
                        },
                      },
                    },
                  });
                }
              }

              // Positional Traits Bar Chart
              if (chartData.positionalTraits && Object.keys(chartData.positionalTraits).length > 0) {
                const traitsCtx = document.getElementById('positionalTraitsChart');
                if (traitsCtx) {
                  const traits = chartData.positionalTraits;
                  new Chart(traitsCtx, {
                    type: 'bar',
                    data: {
                      labels: ['Overall', 'Defensive work rate', 'Passing + Dribbling', 'Speed and runs in behind'],
                      datasets: [{
                        label: 'Score',
                        data: [
                          traits.Overall || 0,
                          traits.DefensiveWorkRate || traits['Defensive work rate'] || 0,
                          traits.PassingDribbling || traits['Passing + Dribbling'] || 0,
                          traits.SpeedRunsInBehind || traits['Speed and runs in behind'] || 0
                        ],
                        backgroundColor: 'rgba(197, 154, 74, 0.55)',
                        borderColor: 'rgba(109, 88, 61, 0.95)',
                        borderWidth: 1,
                        borderRadius: 8,
                        barThickness: 16,
                      }]
                    },
                    options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: 'y',
                      layout: {
                        padding: { left: 12, right: 32, top: 12, bottom: 12 },
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false },
                      },
                      scales: {
                        x: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            stepSize: 20,
                            color: '#7c6a48',
                            font: {
                              size: 9,
                              family: 'system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif',
                            },
                          },
                          grid: {
                            color: 'rgba(199, 170, 121, 0.35)',
                            lineWidth: 0.6,
                          },
                          border: {
                            color: 'rgba(109, 88, 61, 0.8)',
                          },
                        },
                        y: {
                          ticks: {
                            color: '#3b3a30',
                            font: {
                              size: 10,
                              family: 'system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif',
                            },
                          },
                          grid: { display: false },
                        },
                      },
                    },
                  });
                }
              }

              // TFG Rating Trend Line Chart
              if (chartData.tfgRatingTrend && Object.keys(chartData.tfgRatingTrend).length > 0) {
                const ratingCtx = document.getElementById('tfgRatingChart');
                if (ratingCtx) {
                  const trend = chartData.tfgRatingTrend;
                  const labels = Object.keys(trend).filter(k => k !== 'Predicted 2028');
                  const values = labels.map(k => trend[k]);

                  if (trend['Predicted 2028']) {
                    labels.push('Predicted 2028');
                    values.push(trend['Predicted 2028']);
                  }

                  const minVal = Math.min(...values);
                  const maxVal = Math.max(...values);
                  const spread = Math.max(10, maxVal - minVal);
                  // modest vertical padding so the line is centered but not tiny
                  const padding = Math.max(15, Math.round(spread * 0.18));

                  new Chart(ratingCtx, {
                    type: 'line',
                    data: {
                      labels,
                      datasets: [{
                        label: 'TFG Rating',
                        data: values,
                        borderColor: 'rgba(111, 90, 55, 0.95)',
                        backgroundColor: 'rgba(214, 177, 106, 0.25)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: '#f8d59a',
                        pointBorderColor: '#6d593a',
                        pointRadius: 3.5,
                        pointHoverRadius: 5,
                      }]
                    },
                    options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      layout: {
                        padding: { left: 16, right: 18, top: 10, bottom: 12 },
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false },
                      },
                      scales: {
                        y: {
                          beginAtZero: false,
                          min: minVal - padding,
                          max: maxVal + padding,
                          ticks: {
                            stepSize: 10,
                            color: '#7c6a48',
                            font: {
                              size: 9,
                              family: 'system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif',
                            },
                          },
                          grid: {
                            color: 'rgba(199, 170, 121, 0.35)',
                            lineWidth: 0.6,
                          },
                          border: {
                            color: 'rgba(109, 88, 61, 0.8)',
                          },
                        },
                        x: {
                          ticks: {
                            color: '#3b3a30',
                            font: {
                              size: 10,
                              family: 'system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif',
                            },
                          },
                          grid: {
                            color: 'rgba(199, 170, 121, 0.25)',
                            lineWidth: 0.6,
                          },
                          border: {
                            color: 'rgba(109, 88, 61, 0.8)',
                          },
                        },
                      },
                    },
                  });
                }
              }
            })();
          </script>
        </body>
      </html>
    `

    // Set content with proper UTF-8 encoding
    // Use base64 encoding to avoid ByteString character encoding issues with special characters
    // This is more reliable than setContent for content with Unicode characters > 255
    console.log("Setting page content using base64 encoding...")
    
    try {
      // Convert HTML to UTF-8 buffer, then to base64
      // This ensures all Unicode characters (including Ć, é, etc.) are properly handled
      const htmlBuffer = Buffer.from(fullHTML, 'utf8')
      const base64HTML = htmlBuffer.toString('base64')
      
      // Use data URL with base64 encoding - this bypasses all character encoding issues
      await page.goto(`data:text/html;charset=utf-8;base64,${base64HTML}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      })
      console.log("Successfully loaded HTML using base64 encoding")
    } catch (encodingError: any) {
      console.error("Error loading HTML:", encodingError.message)
      
      // Fallback: try setContent if base64 fails (unlikely)
      try {
        console.log("Attempting setContent fallback...")
        await page.setContent(fullHTML, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        })
      } catch (fallbackError: any) {
        // If both fail, log detailed error info
        if (fallbackError.message.includes("ByteString") || fallbackError.message.includes("character")) {
          const indexMatch = fallbackError.message.match(/index (\d+)/)
          if (indexMatch) {
            const problemIndex = parseInt(indexMatch[1], 10)
            const problemChar = fullHTML[problemIndex]
            const problemCode = fullHTML.charCodeAt(problemIndex)
            console.error(`Problematic character at index ${problemIndex}: "${problemChar}" (Unicode: U+${problemCode.toString(16).toUpperCase().padStart(4, '0')})`)
            console.error(`Context:`, fullHTML.substring(Math.max(0, problemIndex - 30), Math.min(fullHTML.length, problemIndex + 30)))
          }
        }
        throw fallbackError
      }
    }

    // Wait for Tailwind and Chart.js to process
    console.log("Waiting for styles and charts to load...")
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Generate PDF
    console.log("Generating PDF...")
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      // Let CSS define the page box so Tailwind layout maps cleanly to A4
      preferCSSPageSize: true,
      // Slightly upscale the page for a crisper result without pushing content to the very edge
      scale: 1.1,
      margin: {
        top: "0.5cm",
        right: "0.5cm",
        bottom: "0.5cm",
        left: "0.5cm",
      },
      timeout: 30000,
    })

    console.log("PDF generated successfully, size:", pdf.length)
    return Buffer.from(pdf)
  } catch (error) {
    console.error("Error generating PDF:", error)
    
    // Provide more detailed error information
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
      
      // Check for specific error types
      if (error.message.includes("timeout")) {
        throw new Error("PDF generation timed out. Please try again.")
      }
      if (error.message.includes("browser") || error.message.includes("puppeteer")) {
        // Surface the underlying browser error so we can diagnose Chromium/Puppeteer issues
        throw new Error(`Failed to launch browser: ${error.message}`)
      }
    }
    
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
  } finally {
    if (browser) {
      try {
        await browser.close()
        console.log("Browser closed successfully")
      } catch (closeError) {
        console.error("Error closing browser:", closeError)
      }
    }
  }
}

