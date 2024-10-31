import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Card from '@material-ui/core/Card';
import { commentBodyStyles } from '@/themes/stylePiping';
import { ContentReplacedSubstringComponentInfo } from '../common/ContentItemBody';
import { PopperPlacementType } from '@material-ui/core/Popper';
import { useGlossaryPinnedState } from '../hooks/useUpdateGlossaryPinnedState';
import { ForumIconName } from '../common/ForumIcon';
import { truncatise } from '@/lib/truncatise';

const styles = (theme: ThemeType) => ({
  card: {
    padding: 16,
    paddingBottom: 10,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    maxWidth: 350,
    ...commentBodyStyles(theme),
    color: theme.palette.grey[700],
    marginTop: 0,
    marginBottom: 0,
    '& .jargon-tooltip-expand': {
      marginLeft: 6,
      color: theme.palette.grey[400],
      fontSize: "0.8em",
    },
  },
  jargonWord: {
    cursor: 'default',
    'a &': {
      // When the span is inside a link, inherit the link's color
      color: 'inherit',
    },
    '&': {
      // Default case (when not in a link)
      color: theme.palette.text.jargonTerm,
    },
  },
  metadata: {
    marginTop: 8,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: theme.palette.grey[600],
    fontSize: "0.8em",
  },
  metadataItem: {
    marginRight: 8,
  },
  icon: {
    width: 12,
    height: 12,
    color: theme.palette.grey[400],
    marginRight: 4,
    position: 'relative',
    top: 1,
  }
});


function convertGlossaryItemToTextReplacement(glossaryItem: JargonTermsPost): ContentReplacedSubstringComponentInfo {
  // Create an array of all terms (original + alternates) to search for
  const allTerms = [glossaryItem.term, ...glossaryItem.altTerms];
  
  // First trim all terms, then sort by length and escape special chars
  const escapedTerms = allTerms
    .map(term => term.trim())
    .sort((a, b) => b.length - a.length)
    .map(term => term.replace(/[\\/$^*+?.()|[\]{}]-/g, '\\$&')); // Escape regex special chars
  
  return {
    replacedString: escapedTerms.join('|'),
    componentName: "JargonTooltip",
    replace: 'all',
    caseInsensitive: true,
    props: {
      term: glossaryItem.term,
      approved: glossaryItem.approved,
      definitionHTML: glossaryItem.contents?.html ?? '',
      altTerms: glossaryItem.altTerms,
      humansAndOrAIEdited: glossaryItem.humansAndOrAIEdited,
    },
    isRegex: true,
  };
}

export function jargonTermsToTextReplacements(terms: JargonTermsPost[]): ContentReplacedSubstringComponentInfo[] {
  return terms.map(convertGlossaryItemToTextReplacement);
}

export const JargonTooltip = ({definitionHTML, approved, forceExpand, humansAndOrAIEdited, isFirstOccurrence = false, placement="top-start", children, classes, tooltipClassName, tooltipTitleClassName, forceTooltip=false, replacedSubstrings}: {
  definitionHTML: string,
  approved: boolean,
  altTerms: string[],
  humansAndOrAIEdited: JargonTermsDefaultFragment['humansAndOrAIEdited'],
  isFirstOccurrence?: boolean,
  placement?: PopperPlacementType
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
  tooltipClassName?: string,
  tooltipTitleClassName?: string,
  forceTooltip?: boolean,
  forceExpand?: boolean,
  replacedSubstrings?: ContentReplacedSubstringComponentInfo[],
}) => {
  const { LWTooltip, ContentItemBody, ForumIcon, LWClickAwayListener } = Components;

  const [open, setOpen] = useState(false);

  const { postGlossariesPinned } = useGlossaryPinnedState();

  let humansAndOrAIEditedText = 'AI Generated'
  let icons = <ForumIcon icon="Sparkles" className={classes.icon}/>;
  if (humansAndOrAIEdited === 'humans') {
    humansAndOrAIEditedText = 'Edited by Human';
    icons = <ForumIcon icon="Pencil" className={classes.icon}/>;
  } else if (humansAndOrAIEdited === 'humansAndAI') {
    humansAndOrAIEditedText = 'Edited by AI and Human';
    icons = <>
      <ForumIcon icon="Sparkles" className={classes.icon}/>
      <ForumIcon icon="Pencil" className={classes.icon}/>
    </>;
  }

  const truncatedDefinitionHTML = (open || forceExpand) ? definitionHTML : truncatise(definitionHTML, {TruncateBy:"paragraphs", TruncateLength:1, Suffix:'<span class="jargon-tooltip-expand">(click to expand)</span>'});


  const tooltip = <Card className={classes.card}>
    <ContentItemBody
      dangerouslySetInnerHTML={{ __html: truncatedDefinitionHTML }}
      replacedSubstrings={replacedSubstrings}
    />
    {open && <div className={classes.metadata}>
      (click anywhere to collapse)
    </div>}
    <div className={classes.metadata}>
      {humansAndOrAIEditedText && <div><span className={classes.metadataItem}>
        {icons}{humansAndOrAIEditedText}
      </span></div>}

      {!approved && <div>Unapproved</div>}
    </div>
  </Card>

  // Check the glossary pinned state is a bit of a hack to allow the tooltip to show up on every occurrence of a jargon term
  // when the glossary is pinned, until we fix substring replacement in general.
  if (!isFirstOccurrence && !postGlossariesPinned && !forceTooltip) {
    return <>{children}</>;
  }

  return <LWTooltip
    title={tooltip}
    tooltip={false}
    // We don't want text in the post to reflow when jargon terms are highlighted
    inlineBlock={false}
    placement={placement}
    className={tooltipClassName}
    titleClassName={tooltipTitleClassName}
    forceOpen={open}
  >
    <LWClickAwayListener onClickAway={() => setOpen(false)}>
      <span className={classes.jargonWord} onClick={() => setOpen(!open)}>
        {children}
      </span>
    </LWClickAwayListener>
  </LWTooltip>;
}

const JargonTooltipComponent = registerComponent('JargonTooltip', JargonTooltip, {styles});

declare global {
  interface ComponentTypes {
    JargonTooltip: typeof JargonTooltipComponent
  }
}
