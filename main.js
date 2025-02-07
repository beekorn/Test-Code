// Editor state
let editor;
let currentMode = 'code';
let isEditing = false;
let isExpanded = false;
let codeHistory = {
  original: '',
  versions: [],
  currentIndex: -1
};

// Core editor functions
function initializeEditor() {
  const textarea = document.getElementById('codeEditor');
  editor = CodeMirror.fromTextArea(textarea, {
    mode: 'text/html',
    theme: 'monokai',
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 4,
    readOnly: true,
    undoDepth: 200
  });
  
  setEditorValue('<!-- Generated code will appear here -->', 'text/html');
  
  editor.on('change', function() {
    document.getElementById('undoButton').disabled = !editor.historySize().undo;
    document.getElementById('redoButton').disabled = !editor.historySize().redo;
  });
}

function setEditorValue(code, language, isNewGeneration = false) {
  code = code.replace(/^<think>[\s\S]*?<\/think>\s*/g, '');
  const cleanCode = removeComments(code, language || 'text/html');

  if (isNewGeneration) {
    codeHistory.original = cleanCode;
    codeHistory.versions = [cleanCode];
    codeHistory.currentIndex = 0;
  } else {
    if (codeHistory.currentIndex >= 0 && 
      cleanCode !== codeHistory.versions[codeHistory.currentIndex]) {
      codeHistory.versions = codeHistory.versions.slice(0, codeHistory.currentIndex + 1);
      codeHistory.versions.push(cleanCode);
      codeHistory.currentIndex++;
    }
  }

  editor.setValue(cleanCode.trim());
  editor.refresh();
  updatePreview();
  updateUndoRedoButtons();
}

function removeComments(code, language) {
  let cleanCode = code;
  if (language === 'python') {
    cleanCode = code.replace(/#.*$/gm, '');
    cleanCode = cleanCode.replace(/'''[\s\S]*?'''/g, '');
    cleanCode = cleanCode.replace(/"""[\s\S]*?"""/g, '');
  } else if (language === 'javascript' || language === 'text/x-c++src' || language === 'text/x-java' || language === 'text/x-csharp') {
    cleanCode = code.replace(/\/\*[\s\S]*?\*\//g, '');
    cleanCode = cleanCode.replace(/\/\/.*$/gm, '');
  } else if (language === 'text/html') {
    cleanCode = code.replace(/<!--[\s\S]*?-->/g, '');
  }
  return cleanCode.replace(/^\s*[\r\n]/gm, '');
}

// Event handlers
document.addEventListener('DOMContentLoaded', function() {
  initializeEditor();
  setMode('code');
  setTimeout(() => editor.refresh(), 100);
});

// UI Control functions
function updateUndoRedoButtons() {
  document.getElementById('undoButton').disabled = codeHistory.currentIndex <= 0;
  document.getElementById('redoButton').disabled = 
    codeHistory.currentIndex >= codeHistory.versions.length - 1;
}

function undo() {
  if (codeHistory.currentIndex > 0) {
    codeHistory.currentIndex--;
    const previousVersion = codeHistory.versions[codeHistory.currentIndex];
    editor.setValue(previousVersion);
    editor.refresh();
    updatePreview();
    updateUndoRedoButtons();
  }
}

function redo() {
  if (codeHistory.currentIndex < codeHistory.versions.length - 1) {
    codeHistory.currentIndex++;
    const nextVersion = codeHistory.versions[codeHistory.currentIndex];
    editor.setValue(nextVersion);
    editor.refresh();
    updatePreview();
    updateUndoRedoButtons();
  }
}

function resetToOriginal() {
  if (codeHistory.original) {
    editor.setValue(codeHistory.original);
    editor.refresh();
    updatePreview();
    setEditorValue(codeHistory.original, 'text/html');
  }
}

function toggleCode() {
  const codeContent = document.getElementById('codeBoxContent');
  const expandIcon = document.getElementById('expandIcon');
  const expandText = document.getElementById('expandText');
  isExpanded = !isExpanded;
  
  codeContent.classList.toggle('expanded');
  expandIcon.classList.toggle('expanded');
  expandText.textContent = isExpanded ? 'Hide Code' : 'Show Code';
  
  if (isExpanded) {
    setTimeout(() => editor.refresh(), 300);
  }
}

function updatePreview() {
  const code = editor.getValue();
  const preview = document.getElementById('previewContainer');
  
  const cleanCode = removeComments(code, 'text/html');
  
  if (true) {
    preview.style.display = 'block';
    const frame = document.getElementById('previewFrame');
    frame.contentDocument.open();
    frame.contentDocument.write(cleanCode);
    frame.contentDocument.close();
  } else {
    preview.style.display = 'none';
  }
}

function refreshPreview() {
  const previewFrame = document.getElementById('previewFrame');
  const code = editor.getValue();
  
  // Save current scroll position
  const scrollX = previewFrame.contentWindow.scrollX;
  const scrollY = previewFrame.contentWindow.scrollY;
  
  // Clear frame and rewrite content
  previewFrame.contentDocument.open();
  previewFrame.contentDocument.write(code);
  previewFrame.contentDocument.close();

  // Wait for load and restore scroll position
  previewFrame.addEventListener('load', function() {
    previewFrame.contentWindow.scrollTo(scrollX, scrollY);
  }, { once: true });
}

function openInNewWindow() {
  const code = editor.getValue();
  const newWindow = window.open('', '_blank');
  newWindow.document.write(code);
  newWindow.document.close();
}

function downloadCode() {
  const code = editor.getValue();
  const defaultName = 'generated_code.html';
  const fileName = prompt('Enter file name:', defaultName) || defaultName;
  
  // Add default extension if none provided
  const finalName = fileName.includes('.') ? fileName : `${fileName}.html`;
  
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Add copy functionality
function copyCode() {
  const code = editor.getValue();
  navigator.clipboard.writeText(code).then(() => {
    const copyButton = document.querySelector('.copy-button');
    copyButton.textContent = '✓ Copied!';
    copyButton.classList.add('copied');
    
    // Reset button after 2 seconds
    setTimeout(() => {
      copyButton.innerHTML = '<span>📋</span> Copy Code';
      copyButton.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy code:', err);
    alert('Failed to copy code to clipboard');
  });
}

function copyPrompt() {
  const promptText = document.getElementById('prompt').value;
  navigator.clipboard.writeText(promptText).then(() => {
    const copyButton = document.querySelector('.copy-prompt-button');
    copyButton.textContent = '✓ Copied!';
    copyButton.classList.add('copied');
    
    // Reset button after 2 seconds
    setTimeout(() => {
      copyButton.innerHTML = '<span>📋</span> Copy Prompt';
      copyButton.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy prompt:', err);
    alert('Failed to copy prompt to clipboard');
  });
}

async function pastePrompt() {
  try {
    const text = await navigator.clipboard.readText();
    document.getElementById('prompt').value = text;
  } catch (err) {
    console.error('Failed to paste prompt:', err);
    alert('Failed to paste from clipboard. Make sure you have granted clipboard permissions.');
  }
}

async function pasteCode() {
  try {
    const text = await navigator.clipboard.readText();
    setEditorValue(text, 'text/html');
    const status = document.getElementById('status');
    status.textContent = 'Code pasted successfully!';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  } catch (err) {
    console.error('Failed to paste code:', err);
    alert('Failed to paste from clipboard. Make sure you have granted clipboard permissions.');
  }
}

// Mode and editing functions
function setMode(mode) {
  currentMode = mode;
  document.getElementById('chatMode').classList.toggle('active', mode === 'chat');
  document.getElementById('codeMode').classList.toggle('active', mode === 'code');
  
  const promptElement = document.getElementById('prompt');
  const generateButton = document.getElementById('generateButton');
  const codeContainer = document.getElementById('codeContainer');
  const chatOutput = document.getElementById('chatOutput');
  
  if (mode === 'chat') {
    promptElement.placeholder = 'Ask a question about game development...';
    generateButton.textContent = 'Send';
    codeContainer.style.display = 'none';
    chatOutput.style.display = 'block';
  } else {
    promptElement.placeholder = 'Describe the code you want to generate...';
    generateButton.textContent = 'Generate Code';
    codeContainer.style.display = 'block';
    chatOutput.style.display = 'none';
  }
}

function editCode() {
  isEditing = !isEditing;
  editor.setOption('readOnly', !isEditing);
  document.getElementById('editButton').textContent = isEditing ? ' Cancel Edit' : ' Manual Edit';
  document.getElementById('saveButton').style.display = isEditing ? 'inline-block' : 'none';
  document.getElementById('aiEditButton').style.display = isEditing ? 'none' : 'inline-block';
  updatePreview();
}

function saveCode() {
  isEditing = false;
  editor.setOption('readOnly', true);
  document.getElementById('editButton').textContent = ' Manual Edit';
  document.getElementById('saveButton').style.display = 'none';
  document.getElementById('aiEditButton').style.display = 'inline-block';
  updatePreview();
}

function aiEdit() {
  const editPromptContainer = document.getElementById('editPromptContainer');
  editPromptContainer.classList.add('visible');
  const editPrompt = document.getElementById('editPrompt');
  editPrompt.focus();
}

function cancelEdit() {
  const editPromptContainer = document.getElementById('editPromptContainer');
  editPromptContainer.classList.remove('visible');
  document.getElementById('editPrompt').value = '';
}

// API interaction
async function sendPrompt() {
  const prompt = document.getElementById('prompt').value;
  const status = document.getElementById('status');
  const apiKey = localStorage.getItem('groqApiKey') || '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';

  if (!prompt.trim()) {
    alert('Please enter a prompt');
    return;
  }

  status.textContent = currentMode === 'chat' ? 'Getting response...' : 'Generating code...';

  try {
    let finalPrompt = prompt;
    if (currentMode === 'code') {
      finalPrompt = `Generate code for the following request. Include only the code without any explanations or markdown. Use proper indentation and comments: ${prompt}`;
    }

    const generationStatus = document.getElementById('generationStatus');
    generationStatus.classList.add('generating');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-r1-distill-llama-70b',
        messages: [{ role: 'user', content: finalPrompt }],
        temperature: currentMode === 'code' ? 0.3 : 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || 'No text generated';

    if (currentMode === 'code') {
      let codeContent = generatedText;
      const codeBlockMatch = generatedText.match(/```(?:\w+)?\n([\s\S]+?)\n```/);
      if (codeBlockMatch) {
        codeContent = codeBlockMatch[1];
      }
      
      setEditorValue(codeContent, 'text/html', true);
      
      document.getElementById('codeContainer').style.display = 'block';
      document.getElementById('chatOutput').style.display = 'none';

      updatePreview();
    } else {
      // Remove <think> tags from chat responses
      const cleanResponse = generatedText.replace(/^<think>[\s\S]*?<\/think>\s*/g, '');
      document.getElementById('chatOutput').textContent = cleanResponse;
      document.getElementById('codeContainer').style.display = 'none';
      document.getElementById('chatOutput').style.display = 'block';
      document.getElementById('previewContainer').style.display = 'none';
    }

    generationStatus.classList.remove('generating');
    status.textContent = currentMode === 'chat' ? 'Response complete!' : 'Code generation complete!';
  } catch (error) {
    const generationStatus = document.getElementById('generationStatus');
    generationStatus.classList.remove('generating');
    console.error('Error:', error);
    status.textContent = `Error: ${error.message}`;
  }
}

async function submitEdit() {
  const editPrompt = document.getElementById('editPrompt');
  const status = document.getElementById('status');
  const currentCode = editor.getValue();
  const apiKey = localStorage.getItem('groqApiKey') || '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';

  if (!editPrompt.value.trim()) {
    alert('Please describe the changes you want to make');
    return;
  }

  status.textContent = 'Applying AI edits...';

  try {
    const finalPrompt = `You are a code editor. Here is the current code:
\`\`\`
${currentCode}
\`\`\`

Please modify the code according to this request: ${editPrompt.value}

IMPORTANT: Return ONLY the modified code itself. Do not include:
- Any explanations
- Any comments (including explanatory comments like "Okay, let me modify this...")
- Any markdown formatting
- Any descriptions of what you're doing

The response should contain nothing but the actual code.`;

    const generationStatus = document.getElementById('generationStatus');
    generationStatus.classList.add('generating');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-r1-distill-llama-70b',
        messages: [{ role: 'user', content: finalPrompt }],
        temperature: 0.3,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let modifiedCode = data.choices?.[0]?.message?.content || 'No changes made';

    modifiedCode = modifiedCode.replace(/^[\s\S]*?(?=[<{(]|function|const|let|var|import|export|class)/, '');
    
    const codeBlockMatch = modifiedCode.match(/```(?:\w+)?\n([\s\S]+?)\n```/);
    if (codeBlockMatch) {
      modifiedCode = codeBlockMatch[1];
    }

    setEditorValue(modifiedCode, 'text/html');

    generationStatus.classList.remove('generating');
    status.textContent = 'AI edits applied successfully!';
    cancelEdit();
  } catch (error) {
    const generationStatus = document.getElementById('generationStatus');
    generationStatus.classList.remove('generating');
    console.error('Error:', error);
    status.textContent = `Error applying edits: ${error.message}`;
  }
}

function resetEverything() {
  // Reset editor content
  editor.setValue('<!-- Generated code will appear here -->');
  editor.clearHistory();
  
  // Reset code history
  codeHistory = {
    original: '',
    versions: [],
    currentIndex: -1
  };
  
  // Reset UI states
  isEditing = false;
  isExpanded = false;
  
  // Reset editor state
  editor.setOption('readOnly', true);
  
  // Reset buttons
  document.getElementById('editButton').textContent = ' Manual Edit';
  document.getElementById('saveButton').style.display = 'none';
  document.getElementById('aiEditButton').style.display = 'inline-block';
  
  // Reset preview
  const previewFrame = document.getElementById('previewFrame');
  previewFrame.contentDocument.open();
  previewFrame.contentDocument.write('');
  previewFrame.contentDocument.close();
  
  // Reset prompt
  document.getElementById('prompt').value = '';
  
  // Reset status
  document.getElementById('status').textContent = '';
  
  // Reset edit prompt
  document.getElementById('editPrompt').value = '';
  document.getElementById('editPromptContainer').classList.remove('visible');
  
  // Reset generation status
  document.getElementById('generationStatus').classList.remove('generating');
  
  // Reset mode to default
  setMode('code');
  
  // Update UI states
  updateUndoRedoButtons();
  updatePreview();
}

function openFileUpload() {
  document.getElementById('fileUpload').click();
}

async function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const status = document.getElementById('status');
  status.textContent = 'Reading files...';

  try {
    let combinedContent = '';
    
    // Sort files to ensure HTML comes first, followed by CSS, then JS
    const sortedFiles = Array.from(files).sort((a, b) => {
      const getFileOrder = (filename) => {
        if (filename.endsWith('.html')) return 0;
        if (filename.endsWith('.css')) return 1;
        if (filename.endsWith('.js')) return 2;
        return 3;
      };
      return getFileOrder(a.name) - getFileOrder(b.name);
    });

    for (const file of sortedFiles) {
      const content = await readFileAsync(file);
      
      // Add file separator comments for clarity
      if (combinedContent) {
        combinedContent += '\n\n/* ===== ' + file.name + ' ===== */\n\n';
      }
      
      if (file.name.endsWith('.css')) {
        combinedContent += wrapCSSContent(content);
      } else if (file.name.endsWith('.js')) {
        combinedContent += wrapJSContent(content);
      } else {
        combinedContent += content;
      }
    }

    setEditorValue(combinedContent, 'text/html', true);
    
    // Reset file input for future uploads
    document.getElementById('fileUpload').value = '';
    
    // Update status
    status.textContent = `${files.length} file(s) uploaded successfully!`;
    setTimeout(() => {
      status.textContent = '';
    }, 3000);

  } catch (error) {
    console.error('Error reading files:', error);
    status.textContent = `Error reading files: ${error.message}`;
  }
}

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error(`Error reading file ${file.name}`));
    reader.readAsText(file);
  });
}

function wrapCSSContent(cssContent) {
  return `<style>\n${cssContent}\n</style>`;
}

function wrapJSContent(jsContent) {
  return `<script>\n${jsContent}\n</script>`;
}

function getLanguageFromFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  switch (extension) {
    case 'js':
      return 'javascript';
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'py':
      return 'python';
    case 'java':
      return 'text/x-java';
    case 'cpp':
    case 'c':
      return 'text/x-c++src';
    case 'cs':
      return 'text/x-csharp';
    default:
      return 'text/plain';
  }
}

// Add these new functions for settings management
function showSettings() {
  const modal = document.getElementById('settingsModal');
  modal.style.display = 'block';
  
  // Load saved API key if it exists
  const savedApiKey = localStorage.getItem('groqApiKey');
  if (savedApiKey) {
    document.getElementById('apiKey').value = savedApiKey;
  }
}

function hideSettings() {
  const modal = document.getElementById('settingsModal');
  modal.style.display = 'none';
}

function toggleApiKeyVisibility() {
  const apiKeyInput = document.getElementById('apiKey');
  const visibilityIcon = document.getElementById('visibilityIcon');
  
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    visibilityIcon.textContent = '👁️‍🗨️';
  } else {
    apiKeyInput.type = 'password';
    visibilityIcon.textContent = '👁️';
  }
}

function saveSettings() {
  const apiKey = document.getElementById('apiKey').value.trim();
  
  if (apiKey) {
    localStorage.setItem('groqApiKey', apiKey);
    hideSettings();
    const status = document.getElementById('status');
    status.textContent = 'Settings saved successfully!';
    setTimeout(() => {
      status.textContent = '';
    }, 3000);
  } else {
    alert('Please enter a valid API key');
  }
}

// Add click outside modal to close
window.onclick = function(event) {
  const modal = document.getElementById('settingsModal');
  if (event.target === modal) {
    hideSettings();
  }
}

function clearPrompt() {
  document.getElementById('prompt').value = '';
  document.getElementById('prompt').focus();
}

async function enhancePrompt() {
  const currentPrompt = document.getElementById('prompt').value.trim();
  if (!currentPrompt) {
    alert('Please enter a prompt to enhance');
    return;
  }

  const status = document.getElementById('status');
  status.textContent = 'Enhancing prompt...';
  
  const apiKey = localStorage.getItem('groqApiKey') || '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';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-r1-distill-llama-70b',
        messages: [
          {
            role: 'system',
            content: `You are an expert at improving and enhancing coding prompts to make them more detailed, specific, and comprehensive. 
            When given a prompt, enhance it by:
            1. Adding specific technical requirements
            2. Including best practices and modern standards
            3. Suggesting additional features that would improve the end result
            4. Specifying design patterns or architectural approaches where relevant
            5. Adding requirements for error handling, accessibility, and responsive design
            Keep the enhanced prompt concise but comprehensive.`
          },
          {
            role: 'user',
            content: `Please enhance this prompt to make it more detailed and advanced: "${currentPrompt}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const enhancedPrompt = data.choices[0].message.content;
    
    document.getElementById('prompt').value = enhancedPrompt;
    status.textContent = 'Prompt enhanced!';
    setTimeout(() => {
      status.textContent = '';
    }, 3000);

  } catch (error) {
    console.error('Error:', error);
    status.textContent = `Error enhancing prompt: ${error.message}`;
  }
}