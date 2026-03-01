// src/components/CodeEditor.jsx

import React, { useRef, useEffect, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useDispatch, useSelector } from 'react-redux';
import { updateFileContent } from '../store/slices/fileSystemSlice';
import { saveFileApi } from '../utils/api';
import { writeToTerminal, toggleBreakpoint, triggerEditorCmd } from '../store/slices/uiSlice';

export default function CodeEditor() {
  const dispatch = useDispatch();
  const monaco = useMonaco();
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  const [fontSize, setFontSize] = useState(14);

  const { activeFileId, fileContents, workspaceId, activeProject, activeBranch } = useSelector(state => state.fileSystem);
  const { editorCmd, debugLine, breakpoints } = useSelector(state => state.ui);
  
  const editorSettings = useSelector(state => state.ui.editorSettings) || {
      autoComplete: true,
      formatOnType: true,
      minimap: true
  };

  const stateRef = useRef({ activeFileId, workspaceId, activeProject, activeBranch });

  useEffect(() => {
      stateRef.current = { activeFileId, workspaceId, activeProject, activeBranch };
  }, [activeFileId, workspaceId, activeProject, activeBranch]);

  const getLanguage = (filename) => {
    if (!filename) return 'text';
    const ext = filename.split('.').pop();
    switch (ext) {
      case 'java': return 'java';
      case 'py': return 'python';
      case 'js': case 'jsx': return 'javascript';
      case 'ts': case 'tsx': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'cpp': return 'cpp';
      case 'c': return 'c';
      case 'cs': return 'csharp';
      case 'json': return 'json';
      default: return 'plaintext';
    }
  };

  const handleEditorChange = (value) => {
    if (activeFileId) dispatch(updateFileContent({ filePath: activeFileId, content: value }));
  };

  const handleEditorDidMount = (editor, monacoInstance) => {
    editorRef.current = editor;

    editor.onMouseDown((e) => {
        if (e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
            const line = e.target.position.lineNumber;
            const currentFile = stateRef.current.activeFileId;
            if (currentFile) {
                dispatch(toggleBreakpoint({ path: currentFile, line }));
            }
        }
    });

    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, async () => {
        const currentContent = editor.getValue();
        const { activeFileId, workspaceId, activeProject, activeBranch } = stateRef.current;

        if(!activeFileId || !workspaceId) return;
        if (!activeProject) {
            dispatch(writeToTerminal(`[Error] No active project selected.\n`));
            return;
        }

        try {
            await saveFileApi(workspaceId, activeProject, activeBranch, activeFileId, currentContent);
            dispatch(writeToTerminal(`[System] Saved: ${activeFileId} (Branch: ${activeBranch})\n`));
        } catch (e) {
            dispatch(writeToTerminal(`[Error] Save failed: ${e.message}\n`));
        }
    });
  };

  useEffect(() => {
      if (!editorRef.current || !editorCmd) return;

      const editor = editorRef.current;
      
      editor.focus();

      switch (editorCmd) {
          case 'undo': editor.trigger('keyboard', 'undo', null); break;
          case 'redo': editor.trigger('keyboard', 'redo', null); break;
          case 'cut': editor.trigger('keyboard', 'editor.action.clipboardCutAction', null); break;
          case 'copy': editor.trigger('keyboard', 'editor.action.clipboardCopyAction', null); break;
          case 'paste': editor.trigger('keyboard', 'editor.action.clipboardPasteAction', null); break;
          case 'find': editor.trigger('keyboard', 'actions.find', null); break;
          case 'replace': editor.trigger('keyboard', 'editor.action.startFindReplaceAction', null); break;
          case 'zoom_in': setFontSize(prev => prev + 2); break;
          case 'zoom_out': setFontSize(prev => Math.max(8, prev - 2)); break;
          case 'go_to_line': editor.trigger('keyboard', 'editor.action.gotoLine', null); break;
          
          case 'go_to_definition': editor.trigger('keyboard', 'editor.action.revealDefinition', null); break;
          case 'go_to_references': editor.trigger('keyboard', 'editor.action.referenceSearch.trigger', null); break;
          case 'autocomplete': editor.trigger('keyboard', 'editor.action.triggerSuggest', null); break;
          case 'format': editor.trigger('keyboard', 'editor.action.formatDocument', null); break;
          case 'rename': editor.trigger('keyboard', 'editor.action.rename', null); break;
          case 'refactor': editor.trigger('keyboard', 'editor.action.refactor', null); break;
          
          case 'toggle_breakpoint':
              const position = editor.getPosition();
              if (position && activeFileId) {
                  dispatch(toggleBreakpoint({ path: activeFileId, line: position.lineNumber }));
              }
              break;
          default: break;
      }

      dispatch(triggerEditorCmd(null)); 

  }, [editorCmd, dispatch, activeFileId]);

  useEffect(() => {
      const styleId = 'monaco-debug-styles';
      if (!document.getElementById(styleId)) {
          const style = document.createElement('style');
          style.id = styleId;
          style.innerHTML = `
              .debug-current-line {
                  background-color: rgba(255, 230, 0, 0.3) !important;
                  border-left: 3px solid #eab308;
              }
              .debug-breakpoint-glyph {
                  background: #ef4444;
                  width: 10px !important;
                  height: 10px !important;
                  border-radius: 50%;
                  margin-left: 6px;
                  margin-top: 5px;
                  cursor: pointer;
                  z-index: 10;
              }
          `;
          document.head.appendChild(style);
      }
  }, []);

  useEffect(() => {
    if (!editorRef.current || !monaco || !activeFileId) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    const newDecorations = [];

    const currentFileBreakpoints = breakpoints.filter(bp => activeFileId.endsWith(bp.path) || bp.path.endsWith(activeFileId));
    
    currentFileBreakpoints.forEach(bp => {
        newDecorations.push({
            range: new monaco.Range(bp.line, 1, bp.line, 1),
            options: {
                isWholeLine: false,
                glyphMarginClassName: 'debug-breakpoint-glyph',
                glyphMarginHoverMessage: { value: 'Breakpoint' }
            }
        });
    });

    if (debugLine && (activeFileId.endsWith(debugLine.path) || debugLine.path.endsWith(activeFileId))) {
        newDecorations.push({
            range: new monaco.Range(debugLine.line, 1, debugLine.line, 1),
            options: {
                isWholeLine: true,
                className: 'debug-current-line'
            }
        });
        editor.revealLineInCenter(debugLine.line);
    }

    decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current, 
        newDecorations
    );

  }, [breakpoints, debugLine, activeFileId, monaco]);

  if (!activeFileId) return <div className="h-full w-full bg-[#fdfdfd] flex items-center justify-center text-gray-400 text-sm">파일을 선택하여 편집을 시작하세요</div>;

  return (
    <div className="h-full w-full overflow-hidden bg-white">
      <Editor
        height="100%"
        theme="light" 
        path={activeFileId}
        language={getLanguage(activeFileId)}
        value={fileContents[activeFileId] || ''}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: fontSize,
          fontFamily: "'D2Coding', 'Consolas', monospace",
          minimap: { enabled: editorSettings.minimap },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          glyphMargin: true,
          renderLineHighlight: "all",
          lineNumbersMinChars: 4,
          padding: { top: 10 },
          quickSuggestions: editorSettings.autoComplete,
          suggestOnTriggerCharacters: editorSettings.autoComplete,
          snippetSuggestions: editorSettings.autoComplete ? "inline" : "none",
          wordBasedSuggestions: editorSettings.autoComplete,
          formatOnType: editorSettings.formatOnType,
          formatOnPaste: editorSettings.formatOnType,
          links: true,
          matchBrackets: "always",
          autoClosingBrackets: "always"
        }}
      />
    </div>
  );
}
