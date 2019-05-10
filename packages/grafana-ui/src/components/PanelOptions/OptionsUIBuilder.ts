import { OptionsGroup, OptionsUIType, OptionEditor, OptionUIComponentProps } from '../../types/panelOptions';
import { PanelOptionsGroup } from '../PanelOptionsGroup/PanelOptionsGroup';
import { Omit } from '../../types/utils';
import React from 'react';
import { BooleanOption } from './BooleanOption';
import { IntegerOption } from './NumericInputOption';
import { FieldDisplayOptions } from '../../utils/index';
import { FieldDisplayEditor, FieldPropertiesEditor } from '../SingleStatShared/index';
import { Threshold } from '../../types/index';
import { ThresholdsEditor } from '../ThresholdsEditor/ThresholdsEditor';

type GroupConfig<TConfig> = TConfig & {
  component?: React.ComponentType<Omit<TConfig, 'component'>>;
};

interface UIModelBuilder<TModel> {
  getUIModel(): TModel;
}

interface EditorOptions {
  label?: string;
  placeholder?: string;
  description?: string;
}

interface EditorConfig<TValueType extends {}> extends EditorOptions {
  component: React.ComponentType<OptionUIComponentProps<TValueType>>;
}

type InferOptionType<TOptions extends object, TKey extends keyof TOptions> = TOptions[TKey];
type KeysMatching<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];
class OptionEditorUIBuilder implements UIModelBuilder<OptionEditor<any, any>> {
  private model: EditorConfig<any>;

  constructor(config: EditorConfig<any>) {
    this.model = config;
  }

  getUIModel = () => {
    return {
      type: OptionsUIType.Editor as OptionsUIType.Editor, // TODO: how to fix this,
      editor: this.model as any,
    };
  };
}

export class OptionsGroupUIBuilder<TOptions extends {}, TConfig extends {} = {}>
  implements UIModelBuilder<OptionsGroup<any>> {
  private groupContent: Array<UIModelBuilder<OptionEditor<any, any> | OptionsGroup<any>>> = [];
  private config: TConfig | null;
  private component: React.ComponentType<TConfig>;

  private ctx: OptionsGroupUIBuilder<TOptions, TConfig> | null;

  constructor(
    ctx?: OptionsGroupUIBuilder<any, any> | null,
    config?: TConfig,
    component?: React.ComponentType<TConfig>
  ) {
    this.ctx = ctx || null;
    this.config = config || null;
    // @ts-ignore
    this.component = component || PanelOptionsGroup;
  }

  addGroup = ({ component, ...rest }: GroupConfig<any>): OptionsGroupUIBuilder<TOptions, TConfig> => {
    const group = new OptionsGroupUIBuilder(this, rest, component);
    this.groupContent.push(group);
    return group as any;
  };

  addNestedOptionsGroup = <T extends keyof TOptions, KConfig>(
    property: T,
    { component, ...rest }: GroupConfig<any>
  ): OptionsGroupUIBuilder<TOptions[T], TConfig> => {
    const group = new OptionsGroupUIBuilder<TOptions[T]>(this, rest, component);
    this.groupContent.push(group);
    return group as any;
  };

  addOptionEditor = <T extends keyof TOptions>(property: T, config: EditorConfig<InferOptionType<TOptions, T>>) => {
    const editor: OptionEditorUIBuilder = new OptionEditorUIBuilder(config);
    this.groupContent.push(editor);
    return this;
  };

  addBooleanEditor = <T extends keyof TOptions>(property: KeysMatching<TOptions, boolean>, config?: EditorOptions) => {
    return this.addOptionEditor(property, {
      component: BooleanOption as any,
      ...config,
    });
  };

  addIntegerEditor = <T extends keyof TOptions>(property: KeysMatching<TOptions, number>, config?: EditorOptions) => {
    return this.addOptionEditor(property, {
      component: IntegerOption as any,
      ...config,
    });
  };

  addFieldDisplayEditor = <T extends keyof TOptions>(
    property: KeysMatching<TOptions, FieldDisplayOptions>,
    config?: EditorOptions
  ) => {
    return this.addOptionEditor(property, {
      component: FieldDisplayEditor as any,
      ...config,
    });
  };

  addFieldPropertiesEditor = <T extends keyof TOptions>(
    property: KeysMatching<TOptions, FieldDisplayOptions>,
    config?: EditorOptions
  ) => {
    return this.addOptionEditor(property, {
      component: FieldPropertiesEditor as any,
      ...config,
    });
  };

  addThresholdsEditor = <T extends keyof TOptions>(
    property: KeysMatching<TOptions, Threshold[]>,
    config?: EditorOptions
  ) => {
    return this.addOptionEditor(property, {
      component: ThresholdsEditor as any,
      ...config,
    });
  };

  endGroup = () => {
    if (this.ctx) {
      return this.ctx;
    }
    return this;
  };

  getUIModel() {
    const model = {
      type: OptionsUIType.Group as OptionsUIType.Group, // TODO: how to fix this
      content: this.groupContent ? this.groupContent.map(c => c.getUIModel()) : [],
      component: this.component,
      config: this.config || ({} as TConfig),
    };

    return model;
  }
}