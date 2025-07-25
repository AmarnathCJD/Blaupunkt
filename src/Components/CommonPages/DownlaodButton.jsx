import React from 'react'
import { FiDownload } from 'react-icons/fi'
import { PDFDocument } from 'pdf-lib'

/**
 * DownloadButton component for displaying downloadable resources
 *
 * @param {Object} props - Component props
 * @param {string} props.productCategory - Optional category to filter appropriate downloads for specific product
 * @param {string} props.className - Optional additional CSS classes
 * @param {Object} props.downloadData - Download data specific to the product category (optional)
 */
const DownloadButton = ({ productCategory, className = '', downloadData }) => {
  // Check if downloadData is provided
  if (!downloadData) {
    console.warn(
      `DownloadButton: No download data available for ${productCategory}`
    )
    return null
  } // Get the appropriate download files based on product category
  const getDownloadFiles = () => {
    // Default files
    let dataSheetFiles = []
    let conformityFiles = []

    if (downloadData?.categories) {
      // Find technical specifications category
      const techSpecsCategory = downloadData.categories.find(
        cat =>
          cat.name.toLowerCase().includes('technical') ||
          cat.name.toLowerCase().includes('specifications')
      )

      // Find installation guides category
      const installationCategory = downloadData.categories.find(cat =>
        cat.name.toLowerCase().includes('installation')
      )

      // Find certification category
      const certificationCategory = downloadData.categories.find(
        cat =>
          cat.name.toLowerCase().includes('certification') ||
          cat.name.toLowerCase().includes('conformity')
      )

      // Get files based on product category
      switch (productCategory) {
        case 'chargingCables': {
          // For cables, include all technical specification files
          dataSheetFiles = techSpecsCategory?.files || []
          conformityFiles = certificationCategory?.files || []
          break
        }
        case 'chargingStations': {
          // For stations, use technical specs only (installation guides removed)
          dataSheetFiles = techSpecsCategory?.files || []
          conformityFiles = certificationCategory?.files || []
          break
        }
        case 'dcChargingStation':
        case 'dcFastChargingStation': {
          // For DC stations, use technical specs and any available installation guides
          dataSheetFiles = [
            ...(techSpecsCategory?.files || []),
            ...(installationCategory?.files || [])
          ]
          conformityFiles = certificationCategory?.files || []
          break
        }
        case 'portableEVCharging': {
          dataSheetFiles = techSpecsCategory?.files || []
          conformityFiles = certificationCategory?.files || []
          break
        }
        default: {
          // Use all available technical files
          dataSheetFiles = techSpecsCategory?.files || []
          conformityFiles = certificationCategory?.files || []
        }
      }
    }

    return { dataSheetFiles, conformityFiles }
  } // Function to create and download combined PDF file
  const createCombinedPDF = async (files, fileName) => {
    if (files.length === 0) {
      console.warn('No files available for download')
      return
    }

    if (files.length === 1) {
      // Single file - direct download
      console.log('Downloading single file:', files[0].name)
      const link = document.createElement('a')
      link.href = files[0].url
      link.download = files[0].name || 'download.pdf'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    // Multiple files - combine into single PDF
    console.log(
      `Combining ${files.length} PDF files:`,
      files.map(f => f.name)
    )
    try {
      const mergedPdf = await PDFDocument.create()

      // Fetch and merge each PDF file
      for (const file of files) {
        try {
          console.log(`Fetching file: ${file.name}`)
          const response = await fetch(file.url)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          const pdfBytes = await response.arrayBuffer()
          const pdf = await PDFDocument.load(pdfBytes)
          const copiedPages = await mergedPdf.copyPages(
            pdf,
            pdf.getPageIndices()
          )
          copiedPages.forEach(page => mergedPdf.addPage(page))
          console.log(`Added ${copiedPages.length} pages from: ${file.name}`)
        } catch (error) {
          console.warn(`Failed to merge file: ${file.name}`, error)
          // Continue with other files instead of failing completely
        }
      }

      // Generate and download the combined PDF
      console.log('Generating combined PDF...')
      const pdfBytes = await mergedPdf.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${fileName}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      console.log('Combined PDF download completed:', `${fileName}.pdf`)
    } catch (error) {
      console.error('Error creating combined PDF:', error)
      // Fallback: open first file in new tab
      if (files.length > 0) {
        console.log('Fallback: opening first file in new tab')
        window.open(files[0].url, '_blank')
      }
    }
  }

  const { dataSheetFiles, conformityFiles } = getDownloadFiles()

  // Don't render the component if no files are available
  if (dataSheetFiles.length === 0 && conformityFiles.length === 0) {
    return null
  }
  return (
    <div
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 ${className}`}
    >
      <h2 className='text-3xl sm:text-3xl lg:text-4xl font-semibold mb-8'>
        Downloads
      </h2>{' '}
      <div className='flex flex-col sm:flex-row gap-4'>
        {' '}
        {/* Data Sheet Button */}
        <button
          onClick={() =>
            createCombinedPDF(
              dataSheetFiles,
              `${productCategory || 'Product'}_Data_Sheets`
            )
          }
          disabled={dataSheetFiles.length === 0}
          className='flex items-center justify-between border-2 rounded-lg px-6 py-3 hover:bg-gray-50 transition-colors duration-300 group border-blaupunkt-secondary text-blaupunkt-secondary bg-transparent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
        >
          <span className='mr-4 text-blaupunkt-secondary group-hover:text-blaupunkt-primary-dark transition-colors font-medium'>
            Data Sheet
          </span>

          <FiDownload className='h-4 w-4 text-blaupunkt-primary' />
        </button>
        {/* Declaration of Conformity Button */}
        <button
          onClick={() =>
            createCombinedPDF(
              conformityFiles,
              `${productCategory || 'Product'}_Conformity_Documents`
            )
          }
          disabled={conformityFiles.length === 0}
          className='flex items-center justify-between border-2 rounded-lg px-6 py-3 hover:bg-gray-50 transition-colors duration-300 group border-blaupunkt-secondary text-blaupunkt-secondary bg-transparent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
        >
          <span className='mr-4 text-blaupunkt-secondary group-hover:text-blaupunkt-primary-dark transition-colors font-medium'>
            Declaration of Conformity
          </span>

          <FiDownload className='h-4 w-4 text-blaupunkt-primary' />
        </button>
      </div>
    </div>
  )
}

export default DownloadButton
