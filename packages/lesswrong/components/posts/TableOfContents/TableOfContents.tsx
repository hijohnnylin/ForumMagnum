import React, { useState, useEffect, useContext } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import withErrorBoundary from '../../common/withErrorBoundary'
import { SidebarsContext } from '../../common/SidebarsWrapper';
import type { ToCData } from '../../../lib/tableOfContents';
import type { ToCDisplayOptions } from './TableOfContentsList';

const styles = (theme: ThemeType): JssStyles => ({
});

const TableOfContents = ({sectionData, title, postedAt, onClickSection, displayOptions, classes, fixedPositionToc = false}: {
  sectionData: ToCData,
  title: string,
  postedAt?: Date,
  onClickSection?: () => void,
  displayOptions?: ToCDisplayOptions,
  classes: ClassesType,
  fixedPositionToc?: boolean
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const {setToC, toc} = useContext(SidebarsContext)!;

  useEffect(() => {
    if (setToC) {
      setToC({title, sectionData});
    }
    
    return () => {
      if (setToC)
        setToC(null);
    }
  }, [title, sectionData, setToC]);

  const displayToc = toc ?? {title, sectionData}

  if (fixedPositionToc) {
    return (
      <Components.FixedPositionToC
        tocSections={displayToc.sectionData.sections}
        title={title}
        postedAt={postedAt}
        onClickSection={onClickSection}
        displayOptions={displayOptions}
      />
    );
  }

  return (
    <Components.TableOfContentsList
      tocSections={sectionData.sections}
      title={title}
      onClickSection={onClickSection}
      displayOptions={displayOptions}
    />
  );
}

const TableOfContentsComponent = registerComponent(
  "TableOfContents", TableOfContents, {
    styles,
    hocs: [withErrorBoundary]
  }
);

declare global {
  interface ComponentTypes {
    TableOfContents: typeof TableOfContentsComponent
  }
}
