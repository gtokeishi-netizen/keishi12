/**
 * Test function definitions to debug the ReferenceError issue
 */

function testFunctionDefinitions() {
  Logger.log('=== Testing Function Definitions ===');
  
  try {
    // Test if performComprehensiveSearch is defined
    if (typeof performComprehensiveSearch === 'function') {
      Logger.log('✓ performComprehensiveSearch is defined');
    } else {
      Logger.log('✗ performComprehensiveSearch is NOT defined');
    }
    
    // Test if extractGrantInformation is defined  
    if (typeof extractGrantInformation === 'function') {
      Logger.log('✓ extractGrantInformation is defined');
    } else {
      Logger.log('✗ extractGrantInformation is NOT defined');
    }
    
    // Test if executeAIResearch is defined
    if (typeof executeAIResearch === 'function') {
      Logger.log('✓ executeAIResearch is defined');
    } else {
      Logger.log('✗ executeAIResearch is NOT defined');
    }
    
    // Try to call the functions with dummy data
    Logger.log('--- Testing function calls ---');
    
    // This should fail if the function isn't properly defined
    Logger.log('Testing executeAIResearch...');
    const result = executeAIResearch('テスト補助金', 999);
    Logger.log('executeAIResearch result: ' + JSON.stringify(result));
    
  } catch (error) {
    Logger.log('Error during testing: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
  }
}