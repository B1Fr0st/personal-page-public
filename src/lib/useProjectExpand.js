import { useState } from 'react';

export default function useProjectExpand() {
  const [expanded, setExpanded] = useState(null);
  const [closing, setClosing] = useState(false);

  function onExpand(project, rect, titleRect) {
    setClosing(false);
    setExpanded({ project, rect, titleRect });
  }

  function onClose() {
    setExpanded(null);
    setClosing(false);
  }

  return { expanded, closing, setClosing, onExpand, onClose };
}
