import React, { useCallback, useState } from 'react'
import { registerComponent, Components } from '../../lib/vulcan-core';
import { Link } from '../../lib/reactRouterWrapper';
import Button from '@material-ui/core/Button';
import Radio from '@material-ui/core/Radio';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  revisionRow: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    marginBottom: 6
  },
  radio: {
    padding: 4,
    '& svg': {
      fontSize: 18,
      opacity: .4
    }
  },
  checked: {
    '& svg': {
      opacity: 1
    }
  },
  radioDisabled: {
    color: "rgba(0,0,0,0) !important",
  },
  charsAdded: {
    color: "#008800",
  },
  charsRemoved: {
    color: "#880000",
  },
  button: {
    marginBottom: 12,
    marginTop: 6
  },
  username: {
    color: "rgba(0,0,0,.87)",
    paddingRight: 10,
    paddingLeft: 4
  },
  link: {
    paddingRight: 8
  },
  version: {
    display: "inline-block",
    width: 50
  }
});

const RevisionSelect = ({ revisions, getRevisionUrl, onPairSelected, loadMoreProps, classes, count, totalCount }: {
  revisions: Array<RevisionMetadataWithChangeMetrics>,
  getRevisionUrl: (rev: RevisionMetadata) => React.ReactNode,
  onPairSelected: ({before, after}: {before: RevisionMetadata, after: RevisionMetadata}) => void,
  loadMoreProps: any,
  classes: ClassesType,
  count?: number,
  totalCount?: number
}) => {
  const { FormatDate, UsersName, LoadMore, LWTooltip } = Components;
  
  const [beforeRevisionIndex, setBeforeRevisionIndex] = useState(1);
  const [afterRevisionIndex, setAfterRevisionIndex] = useState(0);
  
  const compareRevs = useCallback(() => {
    if (!revisions) return;
    onPairSelected({
      before: revisions[beforeRevisionIndex],
      after: revisions[afterRevisionIndex]
    });
  }, [beforeRevisionIndex, afterRevisionIndex, onPairSelected, revisions]);

  return <React.Fragment>
    <table>
      <tbody>
      {revisions.map((rev,i) => {
        const beforeDisabled = i<=afterRevisionIndex;
        const afterDisabled = i>=beforeRevisionIndex;
        const { added, removed } = rev.changeMetrics;
        
        return (
          <tr key={rev.version} className={classes.revisionRow}>
            <td>
              <LWTooltip title={<div>Select as the <em>first</em> revision to compare</div>}>
                <Radio
                  className={classNames(classes.radio, {[classes.checked]: i===beforeRevisionIndex, [classes.radioDisabled]: beforeDisabled})}
                  disabled={beforeDisabled}
                  checked={i===beforeRevisionIndex}
                  onChange={(ev, checked) => {
                    if (checked) {
                      setBeforeRevisionIndex(i);
                    }
                  }}
                />
              </LWTooltip>
              <LWTooltip title={<div>Select as the <em>second</em> revision to compare</div>}>
                <Radio
                  className={classNames(classes.radio, {[classes.checked]: i===afterRevisionIndex, [classes.radioDisabled]: afterDisabled})}
                  disabled={afterDisabled}
                  checked={i===afterRevisionIndex}
                  onChange={(ev, checked) => {
                    if (checked) {
                      setAfterRevisionIndex(i);
                    }
                  }}
                />
              </LWTooltip>
            </td>
            <td className={classes.username}>
              <UsersName documentId={rev.userId}/>{" "}
            </td>
            <td className={classes.link}>
              <Link to={getRevisionUrl(rev)}>
                <span className={classes.version}>v{rev.version}</span>
                <FormatDate format={"MMM Do YYYY z"} date={rev.editedAt}/>{" "}
              </Link>
            </td>
            <td>
              {(added>0 && removed>0)
                  && <>(<span className={classes.charsAdded}>+{added}</span>/<span className={classes.charsRemoved}>-{removed}</span>)</>}
                {(added>0 && removed==0)
                  && <span className={classes.charsAdded}>(+{added})</span>}
                {(added==0 && removed>0)
                  && <span className={classes.charsRemoved}>(-{removed})</span>}
                {" "}
                {rev.commitMessage}
            </td>
          </tr>
        )
      })}
      </tbody>
    </table>
 
    <div><LoadMore {...loadMoreProps} totalCount={totalCount} count={count}/></div>
    <Button className={classes.button} variant="outlined" onClick={compareRevs} >Compare selected revisions</Button>
  </React.Fragment>
}

const RevisionSelectComponent = registerComponent(
  'RevisionSelect', RevisionSelect, {styles}
);

declare global {
  interface ComponentTypes {
   RevisionSelect: typeof RevisionSelectComponent
  }
}
