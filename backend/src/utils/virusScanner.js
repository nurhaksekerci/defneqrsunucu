const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Virus Scanner Utility
 * 
 * KURULUM (Opsiyonel):
 * 
 * Windows:
 * 1. ClamAV'yi indirin: https://www.clamav.net/downloads
 * 2. Kurulum sonrası: C:\Program Files\ClamAV\clamd.exe
 * 3. freshclam ile virus database'i güncelleyin
 * 
 * Linux:
 * sudo apt-get install clamav clamav-daemon
 * sudo freshclam
 * sudo systemctl start clamav-daemon
 * 
 * Environment Variable:
 * ENABLE_VIRUS_SCAN=true
 * CLAMSCAN_PATH=/usr/bin/clamdscan (Linux)
 * CLAMSCAN_PATH=C:\Program Files\ClamAV\clamdscan.exe (Windows)
 */

const VIRUS_SCAN_ENABLED = process.env.ENABLE_VIRUS_SCAN === 'true';
const CLAMSCAN_PATH = process.env.CLAMSCAN_PATH || 'clamdscan';

/**
 * Scan file for viruses using ClamAV
 * @param {string} filePath - Path to file
 * @returns {Promise<{safe: boolean, message: string}>}
 */
exports.scanFile = async (filePath) => {
  // If virus scanning is disabled, skip
  if (!VIRUS_SCAN_ENABLED) {
    return {
      safe: true,
      message: 'Virus scanning disabled'
    };
  }

  try {
    // Run ClamAV scan
    const { stdout, stderr } = await execPromise(`"${CLAMSCAN_PATH}" "${filePath}"`);
    
    // Check output
    if (stdout.includes('FOUND')) {
      return {
        safe: false,
        message: 'Virus detected in file'
      };
    }

    if (stdout.includes('OK')) {
      return {
        safe: true,
        message: 'File is clean'
      };
    }

    // Unknown result
    return {
      safe: false,
      message: 'Unable to determine file safety'
    };
  } catch (error) {
    // If ClamAV is not installed or error occurred
    console.error('Virus scan error:', error.message);
    
    // In production, you might want to reject the file if scan fails
    // For now, we'll allow it but log the error
    return {
      safe: true, // or false for strict mode
      message: `Virus scan failed: ${error.message}`
    };
  }
};

/**
 * Check if virus scanning is available
 * @returns {Promise<boolean>}
 */
exports.isVirusScanAvailable = async () => {
  if (!VIRUS_SCAN_ENABLED) {
    return false;
  }

  try {
    await execPromise(`"${CLAMSCAN_PATH}" --version`);
    return true;
  } catch (error) {
    console.warn('⚠️ ClamAV not available. Virus scanning disabled.');
    return false;
  }
};

// Check availability on module load
if (VIRUS_SCAN_ENABLED) {
  exports.isVirusScanAvailable().then(available => {
    if (available) {
      console.log('✅ Virus scanning enabled (ClamAV)');
    } else {
      console.warn('⚠️ Virus scanning enabled in config but ClamAV not found');
    }
  });
}
